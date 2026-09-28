# docx2png.ps1 — UAT định dạng: Word (COM) xuất PDF → PyMuPDF chụp trang 1 thành PNG.
# Chạy: pwsh tools/docx2png.ps1 build/uat/a.docx [build/uat/b.docx ...]
param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Files)
$w = New-Object -ComObject Word.Application
$w.Visible = $false
try {
  foreach ($f in $Files) {
    $src = (Resolve-Path $f).Path
    $pdf = [IO.Path]::ChangeExtension($src, '.pdf')
    $d = $w.Documents.Open($src, $false, $true)
    $d.SaveAs2($pdf, 17)
    $d.Close($false)
    $env:PYTHONUTF8 = '1'
    python -c "import pymupdf,sys; d=pymupdf.open(sys.argv[1]); [d[i].get_pixmap(dpi=80).save(sys.argv[1][:-4]+('_p%d.png'%(i+1))) for i in range(len(d))]; print(sys.argv[1], len(d), 'trang')" $pdf
  }
} finally { $w.Quit() }
