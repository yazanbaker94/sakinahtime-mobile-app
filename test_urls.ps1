$urls = @(
    # Tafsirs
    "https://sakinahtime.com/tafsirs/jalalayn.json",
    "https://sakinahtime.com/tafsirs/en-tafisr-ibn-kathir.json",
    "https://sakinahtime.com/tafsirs/tafsir-ibn-kathir-ar.json",
    "https://sakinahtime.com/tafsirs/tafsir-as-saadi.json",
    "https://sakinahtime.com/tafsirs/arabic-al-mukhtasar-in-interpreting-the-noble-quran.json",
    # WBW
    "https://sakinahtime.com/translations/wbw/urud-wbw.json",
    "https://sakinahtime.com/translations/wbw/indonesian-word-by-word-translation.json",
    "https://sakinahtime.com/translations/wbw/bangali-word-by-word-translation.json",
    "https://sakinahtime.com/translations/wbw/turkish-wbw-translation.json",
    "https://sakinahtime.com/translations/wbw/tamil-wbw-translation.json",
    "https://sakinahtime.com/translations/wbw/french-wbw-translation.json",
    "https://sakinahtime.com/translations/wbw/persian-wbw-translation.json",
    "https://sakinahtime.com/translations/wbw/german-wbw-translation.json",
    "https://sakinahtime.com/translations/wbw/russian-wbw-translation.json",
    "https://sakinahtime.com/translations/wbw/chinese-wbw-translation.json",
    # Translations (sample)
    "https://sakinahtime.com/translations/abdul-hameed-baqavi-simple.json",
    "https://sakinahtime.com/translations/de-bubenheim-simple.json",
    "https://sakinahtime.com/translations/es-isa-garcia-with-footnote-tags.json",
    "https://sakinahtime.com/translations/fr-unknown-simple.json",
    "https://sakinahtime.com/translations/hindi-wbw-translation.json",
    "https://sakinahtime.com/translations/ru-nuri-simple.json",
    "https://sakinahtime.com/translations/dar-al-salam-center-simple.json"
)

foreach ($u in $urls) {
    try {
        $r = Invoke-WebRequest -Uri $u -Method Head -TimeoutSec 10 -ErrorAction Stop
        Write-Host "OK $($r.StatusCode) $u"
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        Write-Host "FAIL $status $u"
    }
}
