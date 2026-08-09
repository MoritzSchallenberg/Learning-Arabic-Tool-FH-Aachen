// Kurs 1 – Wortplan-Grundgerüst (Entwicklungsauftrag 6).
//
// WICHTIG zur Herkunft der Arabisch-Angaben in diesem Ordner:
// Die vom Nutzer übergebenen Quelldateien (neue_vokabeln_759.md/.json, kurs1_900_wortplan.json)
// kamen in diesem Arbeitsschritt mit einem Zeichenkodierungsfehler an (UTF-8-Bytes wurden auf dem
// Transportweg beschädigt/verlustbehaftet als Latin-1 interpretiert). Deutsche Umlaute (ä/ö/ü)
// ließen sich verlustfrei zurückrechnen, "ß" ging dabei vereinzelt verloren (von Hand anhand der
// Wortliste korrigiert). Die arabischen Formen waren dagegen NICHT verlustfrei rekonstruierbar
// (mehrere Bytes pro Wort komplett verloren) und wurden daher NICHT übernommen.
//
// Übernommen aus den Quelldateien: Unit-Nummerierung/-Titel, Wort-IDs, Reihenfolge, deutsche
// Bedeutungen. Die arabischen Formen (arabic_unvocalized, bei Unit 1-5 zusätzlich vokalisiert +
// Umschrift + Grammatikangaben) wurden für diesen Schritt neu erstellt (MSA-Standardwortschatz).
// Sie sind wie im Auftrag gefordert durchgehend "needs_language_review" markiert.

const UNIT_TITLES = {
  1: 'Begrüßung, Höflichkeit und kurze Antworten',
  2: 'Familie, Beziehungen und Personen',
  3: 'Zuhause und Räume',
  4: 'Persönliche Angaben, Länder, Sprachen und Nationalitäten',
  5: 'Zahlen, Mengen und Maße',
  6: 'Uhrzeit, Wochentage, Monate und Kalender',
  7: 'Farben, Formen und Materialien',
  8: 'Möbel, Haushalt und Alltagsgegenstände',
  9: 'Lebensmittel und Grundnahrungsmittel',
  10: 'Getränke, Mahlzeiten und Küche',
  11: 'Einkaufen, Geld und Preise',
  12: 'Kleidung, Schuhe und Accessoires',
  13: 'Körper und Sinne',
  14: 'Gesundheit, Beschwerden und Apotheke',
  15: 'Gefühle, Eigenschaften und Zustände',
  16: 'Tagesablauf und Gewohnheiten',
  17: 'Häufige Verben I: Bewegung und praktische Handlungen',
  18: 'Häufige Verben II: Denken, Sprechen und Wahrnehmung',
  19: 'Häufige Adjektive und Gegensätze',
  20: 'Stadt, Gebäude und öffentliche Orte',
  21: 'Position, Richtung und wichtige Präpositionen',
  22: 'Verkehr, Reisen und Hotel',
  23: 'Schule, Unterricht und Schulsachen',
  24: 'Universität, Studium und Prüfungen',
  25: 'Arbeit, Berufe und Büro',
  26: 'Technik, Internet und Medien',
  27: 'Natur, Wetter und Umwelt',
  28: 'Tiere und Pflanzen',
  29: 'Freizeit, Sport und Kultur',
  30: 'Fragewörter, Konnektoren und Funktionswörter'
};

// Bestehende 141 Wort-IDs, ihrer künftigen Unit zugeordnet (Reihenfolge = Kategorienreihenfolge
// in vocabulary.json). Diese Zuordnung entspricht 1:1 der Themenzuordnung aus dem Wortplan.
const UNIT_EXISTING_WORD_IDS = {
  1: ['greet_hallo', 'greet_salam', 'greet_morning', 'greet_evening', 'greet_bye', 'greet_thanks', 'greet_please', 'greet_yes', 'greet_no'],
  2: ['family_father', 'family_mother', 'family_brother', 'family_sister', 'family_son', 'family_daughter', 'family_grandfather', 'family_grandmother'],
  3: ['housing_house', 'housing_room', 'housing_kitchen', 'housing_bathroom', 'housing_door', 'housing_window', 'housing_bed', 'housing_table'],
  4: [],
  5: ['num_1', 'num_2', 'num_3', 'num_4', 'num_5', 'num_6', 'num_7', 'num_8', 'num_9', 'num_10'],
  6: ['time_morning', 'time_noon', 'time_evening', 'time_night', 'time_day', 'time_week'],
  7: ['color_red', 'color_blue', 'color_yellow', 'color_green', 'color_black', 'color_white'],
  8: [],
  9: ['food_bread', 'food_apple'],
  10: ['food_water', 'food_milk', 'food_coffee', 'food_tea'],
  11: ['shop_money', 'shop_price', 'shop_store', 'shop_bag'],
  12: ['clothing_shirt', 'clothing_pants', 'clothing_shoe', 'clothing_coat', 'clothing_hat'],
  13: ['body_head', 'body_hand', 'body_eye', 'body_nose', 'body_mouth', 'body_foot'],
  14: [],
  15: [],
  16: ['verb_live'],
  17: ['verb_go', 'verb_play', 'verb_work', 'verb_eat', 'verb_drink'],
  18: ['verb_study', 'verb_understand'],
  19: [],
  20: ['place_city', 'place_village', 'place_street', 'place_restaurant', 'place_hospital', 'place_station', 'place_office', 'place_mosque'],
  21: [],
  22: ['transport_car', 'transport_bus', 'transport_train', 'transport_plane', 'transport_bike', 'transport_ship'],
  23: ['school_bag', 'school_board', 'school_eraser', 'school_ruler'],
  24: ['uni_university', 'uni_student_m', 'uni_student_f', 'uni_professor', 'uni_lecture', 'uni_exam', 'uni_library'],
  25: ['job_doctor', 'job_engineer', 'job_teacher', 'job_nurse', 'job_police', 'job_cook', 'job_driver'],
  26: ['tech_computer', 'tech_phone', 'tech_internet', 'tech_screen', 'tech_program'],
  27: ['weather_sun', 'weather_rain', 'weather_snow', 'weather_wind', 'weather_cloud', 'weather_hot', 'weather_cold'],
  28: ['animal_cat', 'animal_dog', 'animal_horse', 'animal_lion', 'animal_bird', 'animal_fish', 'animal_rabbit', 'animal_chicken', 'animal_cow', 'animal_mouse'],
  29: ['leisure_film', 'leisure_music', 'leisure_sport', 'leisure_game'],
  30: ['q_who', 'q_what', 'q_where', 'q_when', 'q_how', 'q_why', 'q_howmany']
};

module.exports = { UNIT_TITLES, UNIT_EXISTING_WORD_IDS };
