import json

# Read the file
with open('client/data/quran-uthmani.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Find verses with hizbQuarter 3 in Al-Baqarah (surah 2)
for verse in data:
    if verse.get('hizbQuarter') == 3:
        surah_num = verse.get('number', 0)
        # Al-Baqarah starts at verse 8 (after Al-Fatihah's 7 verses)
        if 8 <= surah_num <= 293:  # Al-Baqarah range
            verse_in_surah = verse.get('numberInSurah', 0)
            print(f"Verse {surah_num}, Surah 2 Ayah {verse_in_surah}: hizbQuarter = 3")
            if verse_in_surah < 50:  # Only show first occurrences
                break

# Now fix: hizbQuarter 3 should start at Al-Baqarah ayah 26 (verse number 33)
# Al-Fatihah = verses 1-7, so Al-Baqarah starts at verse 8
# Al-Baqarah ayah 26 = verse 8 + 26 - 1 = verse 33

for verse in data:
    verse_num = verse.get('number', 0)
    # Verses 33-50 should be hizbQuarter 3 (Baqarah 26-43)
    if 33 <= verse_num <= 50:
        verse['hizbQuarter'] = 3
    # Verses 51 onwards should be hizbQuarter 4 until next boundary
    # But let's just fix the start of hizb 3 for now

# Write back
with open('client/data/quran-uthmani.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Fixed hizbQuarter 3 to start at Baqarah ayah 26")
