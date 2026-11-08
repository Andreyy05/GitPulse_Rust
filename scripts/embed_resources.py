"""
Post-build helper for GitPulse on Windows:
Embeds the application manifest (enabling Common Controls v6 for TaskDialogIndirect and modern Win32 UI)
and icon resources into the compiled binary using Windows Win32 API BeginUpdateResourceW.
"""

import ctypes
from ctypes import wintypes
import os
import struct
import sys

kernel32 = ctypes.WinDLL('kernel32', use_last_error=True)

BeginUpdateResourceW = kernel32.BeginUpdateResourceW
BeginUpdateResourceW.argtypes = [wintypes.LPCWSTR, wintypes.BOOL]
BeginUpdateResourceW.restype = wintypes.HANDLE

UpdateResourceW = kernel32.UpdateResourceW
UpdateResourceW.argtypes = [wintypes.HANDLE, ctypes.c_void_p, ctypes.c_void_p, wintypes.WORD, ctypes.c_void_p, wintypes.DWORD]
UpdateResourceW.restype = wintypes.BOOL

EndUpdateResourceW = kernel32.EndUpdateResourceW
EndUpdateResourceW.argtypes = [wintypes.HANDLE, wintypes.BOOL]
EndUpdateResourceW.restype = wintypes.BOOL

MANIFEST_XML = b"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <dependency>
    <dependentAssembly>
      <assemblyIdentity
        type="win32"
        name="Microsoft.Windows.Common-Controls"
        version="6.0.0.0"
        processorArchitecture="*"
        publicKeyToken="6595b64144ccf1df"
        language="*"
      />
    </dependentAssembly>
  </dependency>
</assembly>"""

def embed_resources(exe_path, ico_path):
    if not os.path.exists(exe_path):
        print(f"[embed_resources] Exe not found, skipping: {exe_path}")
        return

    # 1. Write companion manifest file
    manifest_path = exe_path + ".manifest"
    try:
        with open(manifest_path, 'wb') as mf:
            mf.write(MANIFEST_XML)
    except Exception as e:
        print(f"[embed_resources] Warning: Could not write sidecar manifest: {e}")

    # 2. Embed into PE resource section
    h = BeginUpdateResourceW(exe_path, False)
    if not h:
        print(f"[embed_resources] BeginUpdateResourceW failed for {exe_path}: error {ctypes.get_last_error()}")
        return

    try:
        # RT_MANIFEST = 24, Name = 1, Lang = 1033
        if not UpdateResourceW(h, ctypes.c_void_p(24), ctypes.c_void_p(1), 1033, MANIFEST_XML, len(MANIFEST_XML)):
            raise ctypes.WinError(ctypes.get_last_error())

        # Icons
        if os.path.exists(ico_path):
            with open(ico_path, 'rb') as f:
                ico_data = f.read()

            reserved, ico_type, count = struct.unpack_from('<HHH', ico_data, 0)
            if ico_type == 1:
                grp_entries = []
                offset = 6
                for i in range(count):
                    entry = ico_data[offset:offset+16]
                    bWidth, bHeight, bColorCount, bReserved, wPlanes, wBitCount, dwBytesInRes, dwImageOffset = struct.unpack('<BBBBHHII', entry)
                    offset += 16
                    icon_id = i + 1
                    grp_entry = struct.pack('<BBBBHHIH', bWidth, bHeight, bColorCount, bReserved, wPlanes, wBitCount, dwBytesInRes, icon_id)
                    grp_entries.append(grp_entry)
                    img_data = ico_data[dwImageOffset : dwImageOffset + dwBytesInRes]
                    # RT_ICON = 3
                    UpdateResourceW(h, ctypes.c_void_p(3), ctypes.c_void_p(icon_id), 0, img_data, len(img_data))

                grp_header = struct.pack('<HHH', reserved, ico_type, count)
                grp_data = grp_header + b''.join(grp_entries)
                # RT_GROUP_ICON = 14
                for group_id in [1, 32512]:
                    UpdateResourceW(h, ctypes.c_void_p(14), ctypes.c_void_p(group_id), 0, grp_data, len(grp_data))

        if not EndUpdateResourceW(h, False):
            raise ctypes.WinError(ctypes.get_last_error())

        print(f"[embed_resources] Successfully embedded manifest & icon into: {exe_path}")
    except Exception as e:
        EndUpdateResourceW(h, True)
        print(f"[embed_resources] Error embedding resources into {exe_path}: {e}")

if __name__ == '__main__':
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ico_file = os.path.join(root_dir, 'src-tauri', 'icons', 'icon.ico')

    targets = [
        os.path.join(root_dir, 'src-tauri', 'target', 'release', 'gitpulse.exe'),
        os.path.join(root_dir, 'src-tauri', 'target', 'debug', 'gitpulse.exe'),
    ]

    for target in targets:
        embed_resources(target, ico_file)

