#!/usr/bin/env python3
"""
render_local.py — sinh thư .docx cục bộ từ mẫu đã chuẩn hoá (build/templates, do tools/normalize.js sinh) + bộ trường JSON,
dùng CHÍNH lõi gas/Core.gs (qua node) → kết quả giống hệt GAS. Dùng để UAT định dạng không cần deploy.

Chạy: PYTHONUTF8=1 python tools/render_local.py <template_id> <fields.json> <out.docx>
"""
import json
import os
import re
import subprocess
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PARTS = re.compile(r"^word/(document|header\d*|footer\d*)\.xml$")

NODE_FILL = r"""
const C = require(process.argv[1]);
let buf = '';
process.stdin.on('data', (d) => (buf += d));
process.stdin.on('end', () => {
  const j = JSON.parse(buf);
  const n = C.normalizeFields(j.fields);
  const rs = C.renderSlots(j.slots, n.fields);
  const parts = {};
  for (const k of Object.keys(j.parts)) parts[k] = C.fillXml(j.parts[k], rs.values, rs.missing).xml;
  process.stdout.write(JSON.stringify({ parts, missing: rs.missing, warnings: n.warnings }));
});
"""


def main():
    tid, fields_path, out = sys.argv[1:4]
    cat = json.load(open(os.path.join(ROOT, "build", "catalog.json"), encoding="utf-8"))
    tpl = next(t for t in cat["templates"] if t["id"] == tid)
    src = os.path.join(ROOT, "build", "templates", tid + ".docx")
    zin = zipfile.ZipFile(src)
    parts = {n: zin.read(n).decode("utf-8") for n in zin.namelist() if PARTS.match(n) and b"{{" in zin.read(n)}
    payload = json.dumps({"fields": json.load(open(fields_path, encoding="utf-8")), "slots": tpl["slots"], "parts": parts})
    res = subprocess.run(["node", "-e", NODE_FILL, os.path.join(ROOT, "gas", "Core.gs")],
                         input=payload.encode("utf-8"), capture_output=True, check=True)
    r = json.loads(res.stdout.decode("utf-8"))
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = r["parts"][item.filename].encode("utf-8") if item.filename in r["parts"] else zin.read(item.filename)
            zout.writestr(item, data)
    print("template:", tid, "|", tpl["label"])
    print("missing:", r["missing"])
    print("warnings:", r["warnings"])


if __name__ == "__main__":
    main()
