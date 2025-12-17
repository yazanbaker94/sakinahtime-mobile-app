import json

with open('client/data/quran-uthmani.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

basmala = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"

for surah in data['data']['surahs']:
    if surah['number'] != 1:
        for ayah in surah['ayahs']:
            if basmala in ayah['text']:
                ayah['text'] = ayah['text'].replace(basmala, '').strip()

with open('client/data/quran-uthmani.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Fixed: Basmala removed from client/data/quran-uthmani.json")
