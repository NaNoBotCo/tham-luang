#!/usr/bin/env python3
"""build.py — writes docs/index.html (English) and docs/th/index.html (Thai), sitemap.xml,
robots.txt and llms.txt from the copy below. Both languages are written by hand here.

Run:  python3 tools/build.py
"""
import html
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(HERE, "..", "docs")
BASE = "https://nanobotco.github.io/tham-luang/"
E = html.escape
CSS = open(os.path.join(HERE, "site.css")).read()
GOOGLE_ESCAPE = '<script>if(/[.]translate[.]goog$/.test(location.hostname))location.replace("https://"+location.hostname.slice(0,-15).replace(/--/g,"~").replace(/-/g,".").replace(/~/g,"-")+location.pathname+location.search.replace(/([?&])_x_tr_[^&]*/g,"$1").replace(/[?&]+$/,"").replace(/[?]&+/,"?")+location.hash)</script>'

# The thirteen, in the order they came out (English Wikipedia's table; Thai names from Thai Wikipedia).
TEAM = [
    # en name, th name, nickname en, nickname th, age, day
    ("Prachak Sutham", "ประจักษ์ สุธรรม", "Note", "โน้ต", 15, 1),
    ("Natthawut Thakhamsong", "ณัฐวุฒิ ทาคำทรง", "Tern", "เติ้ล", 14, 1),
    ("Phiphat Phothi", "พิพัฒน์ โพธิ", "Nick", "นิค", 15, 1),
    ("Phiraphat Somphiangchai", "พีรภัทร สมเพียงใจ", "Night", "ไนท์", 16, 1),
    ("Phanumat Saengdi", "ภาณุมาศ แสงดี", "Mick", "มิกซ์", 13, 2),
    ("Adul Sam-on", "อดุลย์ สามอ่อน", "Dul", "ดุล", 14, 2),
    ("Ekkarat Wongsukchan", "เอกรัฐ วงค์สุขจันทร์", "Biw", "บิว", 14, 2),
    ("Duangphet Phromthep", "ดวงเพชร พรหมเทพ", "Dom", "ดอม", 13, 2),
    ("Ekkaphon Kanthawong", "เอกพล จันทะวงษ์", "Ekk", "เอก", 25, 3),
    ("Phonchai Khamluang", "พรชัย คำหลวง", "Tee", "ตี๋", 16, 3),
    ("Chanin Wibunrungrueang", "ชนินท์ วิบูลย์รุ่งเรือง", "Titan", "ไตตั้น", 11, 3),
    ("Somphong Chaiwong", "สมพงศ์ ใจวงศ์", "Pong", "พงศ์", 13, 3),
    ("Mongkhon Bunpiam", "มงคล บุญเปี่ยม", "Mark", "มาร์ค", 13, 3),
]
TEAM_NOTE = {
    "en": {"Dom": "Team captain", "Dul": "Spoke English with the first divers", "Night": "His birthday", "Ekk": "Assistant coach, once a monk"},
    "th": {"Dom": "กัปตันทีม", "Dul": "คุยภาษาอังกฤษกับนักดำน้ำชุดแรก", "Night": "วันเกิดของเขา", "Ekk": "ผู้ช่วยผู้ฝึกสอน เคยบวชเป็นพระ"},
}

PHOTOS = [
    ("mouth.jpg", 1600, 900, "https://commons.wikimedia.org/wiki/File:Tham_Luang_Nang_Non,_cave_mouth.jpg", "NaN · Mot Dang", "CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/",
     {"en": "The mouth of Tham Luang today.", "th": "ปากถ้ำหลวงวันนี้"}),
    ("pipe.jpg", 1600, 1328, "https://commons.wikimedia.org/wiki/File:4547274_Thai_rescue_workers_positioning_a_pipe_for_the_pumping_operation_in_the_Tham_Luang_cave.jpg", "Capt. Jessica Tait, U.S. Air Force", "Public domain", None,
     {"en": "2 July 2018: Thai rescue workers carry pipe up to the cave for the pumps.", "th": "2 กรกฎาคม 2561 เจ้าหน้าที่ไทยแบกท่อขึ้นไปที่ถ้ำ เพื่อต่อเครื่องสูบน้ำ"}),
    ("divers.jpg", 1600, 1067, "https://commons.wikimedia.org/wiki/File:4547292_Cave_rescue_divers_prepare_dive_equipment_at_Tham_Luang_cave.jpg", "Capt. Jessica Tait, U.S. Air Force", "Public domain", None,
     {"en": "2 July 2018: cave divers ready their gear at the camp by the cave. That night two of the divers found the team.", "th": "2 กรกฎาคม 2561 นักดำน้ำถ้ำเตรียมอุปกรณ์ที่แคมป์หน้าถ้ำ คืนนั้นนักดำน้ำสองคนพบทีมหมูป่า"}),
    ("letter-th.jpg", 1100, 1726, "https://commons.wikimedia.org/wiki/File:Royal_Letter_of_king_rama_x_to_Tham_Luang_cave_rescue_(Thai_version).jpg", "Royal Household / Thai government", "Public domain", None,
     {"en": "12 July 2018: King Vajiralongkorn's letter thanking everyone who took part. An English version was issued too.", "th": "12 กรกฎาคม 2561 พระราชหัตถเลขาขอบใจทุกคนทุกฝ่ายที่ร่วมปฏิบัติการ มีฉบับภาษาอังกฤษด้วย"}),
    ("telluride.jpg", 1600, 966, "https://commons.wikimedia.org/wiki/File:Tham_Luang_Cave_rescue_team_at_screening_of_The_Rescue_at_Telluride_Film_Festival_1.jpg", "Alejandra Fontalvo, U.S. Air Force", "Public domain", None,
     {"en": "September 2021: Capt. Mitch Torrel of US Air Force Special Tactics talks about the rescue with other members of the team at a screening of the documentary The Rescue.", "th": "กันยายน 2564 ร.อ. มิตช์ ทอร์เรล หน่วยปฏิบัติการพิเศษกองทัพอากาศสหรัฐฯ เล่าเรื่องการกู้ภัยกับทีมนานาชาติ ในรอบฉายสารคดี The Rescue"}),
]

DAYS = {
    "en": [
        ("23 Jun", "After practice the Wild Boars ride their bicycles to the cave. Twelve boys aged 11 to 16 and their 25-year-old assistant coach go in. Rain starts, and the passages fill behind them."),
        ("24 Jun", "Their bicycles and bags are found at the mouth. Inside, rescuers find handprints and footprints."),
        ("25 Jun", "Thai Navy SEAL divers start searching. The water is so murky that even with lights they cannot see."),
        ("26 Jun", "Divers reach the T-junction and floodwater pushes them back."),
        ("27 Jun", "Three British Cave Rescue Council divers arrive. Rain floods the passages again."),
        ("28 Jun", "A US Air Force team joins. Heavy rain stops the search. Pumps arrive, and hundreds of people search the mountain for another way in."),
        ("29 Jun", "Australian Federal Police divers arrive. The prime minister visits and tells the families not to give up."),
        ("30 Jun", "A break in the rain. Divers push further in."),
        ("1 Jul", "Chamber 3 becomes the base: a store of air cylinders inside the mountain."),
        ("2 Jul", "Late at night John Volanthen and Rick Stanton surface into an air pocket and find all thirteen alive on a ledge about 400 m past Pattaya Beach. They smelled them before they saw them."),
        ("3 Jul", "Thai Navy SEALs and an army doctor reach the boys with food and medicine. Four of them stay with the team until the end."),
        ("4 Jul", "The boys try full-face masks. Pumps pull 1.6 million litres an hour out of the cave."),
        ("5 Jul", "A dry spell. The water drops about 1.5 cm an hour, and rescuers can walk 1.5 km in."),
        ("6 Jul", "About 1 a.m., Saman Kunan, a former Navy SEAL, dies on his way back from leaving air tanks near the T-junction. Oxygen in the boys' chamber is falling."),
        ("7 Jul", "Rain is forecast. The plan is set: the divers will carry the boys out asleep."),
        ("8 Jul", "Day one. Eighteen divers go in. By evening four boys are out and on their way to hospital in Chiang Rai."),
        ("9 Jul", "Day two. Four more boys come out."),
        ("10 Jul", "Day three. The last four boys and their coach, then the three SEALs and the doctor. A pump fails behind them and the water rises 50 cm every ten minutes as the last rescuers hurry out."),
    ],
    "th": [
        ("23 มิ.ย.", "หลังซ้อมบอล ทีมหมูป่าปั่นจักรยานไปถ้ำ เด็กสิบสองคน อายุ 11 ถึง 16 ปี กับโค้ชผู้ช่วยวัย 25 ปี เดินเข้าไป ฝนเริ่มตก น้ำท่วมทางข้างหลังพวกเขา"),
        ("24 มิ.ย.", "พบจักรยานและกระเป๋าที่ปากถ้ำ ข้างในพบรอยมือรอยเท้า"),
        ("25 มิ.ย.", "นักดำน้ำหน่วยซีลเริ่มค้นหา น้ำขุ่นจนเปิดไฟแล้วก็ยังมองไม่เห็น"),
        ("26 มิ.ย.", "นักดำน้ำไปถึงสามแยก แล้วถูกน้ำดันกลับ"),
        ("27 มิ.ย.", "นักดำน้ำสามคนจาก British Cave Rescue Council มาถึง ฝนทำให้น้ำท่วมทางอีก"),
        ("28 มิ.ย.", "ทีมกองทัพอากาศสหรัฐฯ มาสมทบ ฝนหนักจนต้องหยุดค้นหา เครื่องสูบน้ำมาถึง คนหลายร้อยขึ้นไปหาทางเข้าอื่นบนดอย"),
        ("29 มิ.ย.", "นักดำน้ำตำรวจสหพันธรัฐออสเตรเลียมาถึง นายกรัฐมนตรีมาเยี่ยม บอกครอบครัวว่าอย่าหมดหวัง"),  # stylecheck: allow — reported speech, a fact of the day
        ("30 มิ.ย.", "ฝนเว้น นักดำน้ำดันเข้าไปได้ลึกขึ้น"),
        ("1 ก.ค.", "โถงสามกลายเป็นฐาน เป็นคลังถังอากาศอยู่ในภูเขา"),
        ("2 ก.ค.", "ดึกคืนนั้น จอห์น โวลันเธน กับริก สแตนตัน โผล่ขึ้นในโพรงอากาศ พบทั้งสิบสามคนยังมีชีวิต บนเนินนมสาว เลยหาดพัทยาไปราว 400 เมตร ได้กลิ่นก่อนจะเห็นตัว"),
        ("3 ก.ค.", "หน่วยซีลกับแพทย์ทหารบกไปถึงเด็กๆ พร้อมอาหารและยา สี่คนอยู่กับทีมจนวันสุดท้าย"),
        ("4 ก.ค.", "เด็กๆ ลองหน้ากากแบบเต็มหน้า เครื่องสูบน้ำดูดน้ำออกชั่วโมงละ 1.6 ล้านลิตร"),
        ("5 ก.ค.", "ฝนหยุดหลายวัน น้ำลดราวชั่วโมงละ 1.5 ซม. เจ้าหน้าที่เดินเข้าไปได้ 1.5 กม."),
        ("6 ก.ค.", "ราวตีหนึ่ง จ่าแซม สมาน กุนัน อดีตหน่วยซีล เสียชีวิตขณะดำกลับ หลังนำถังอากาศไปวางใกล้สามแยก ออกซิเจนในโถงที่เด็กๆ อยู่ลดลง"),
        ("7 ก.ค.", "พยากรณ์ว่าฝนจะมา แผนลงตัว นักดำน้ำจะพาเด็กออกมาขณะหลับ"),
        ("8 ก.ค.", "วันแรก นักดำน้ำสิบแปดคนเข้าไป ถึงค่ำ เด็กสี่คนออกมา และถูกส่งโรงพยาบาลในเชียงราย"),
        ("9 ก.ค.", "วันที่สอง เด็กออกมาอีกสี่คน"),
        ("10 ก.ค.", "วันที่สาม เด็กสี่คนสุดท้ายกับโค้ช แล้วหน่วยซีลสามคนกับหมอ เครื่องสูบน้ำดับข้างหลัง น้ำขึ้นสิบนาทีละ 50 ซม. ขณะเจ้าหน้าที่ชุดสุดท้ายรีบออกมา"),
    ],
}

UI = {
    "en": {
        "title": "Tham Luang, Drawn",
        "other_title": "ถ้ำหลวง วาดด้วยคณิต",
        "kicker": "ถ้ำหลวง · Chiang Rai · June–July 2018",
        "lede": "Thirteen people trapped inside a flooded mountain for eighteen days, and how about ten thousand people brought them home. Drawn from the numbers.",
        "cardline": "ถ้ำหลวง · how the Wild Boars came home",
        "nav": [("mountain", "Mountain"), ("map", "Map"), ("squeeze", "Squeeze"), ("water", "Water"), ("air", "Air"), ("out", "Way out"), ("people", "People"), ("remembered", "Remembered"), ("pictures", "Pictures"), ("sources", "Sources")],
        "play": "Play", "pause": "Pause", "slider": "Day",
        "hero_note": "Not to scale: heights are stretched so the cave shows. Rain and water level follow the day-by-day reports, not a gauge. Each light is a person.",
        "mtn_h": "The mountain",
        "mtn_kick": "ดอยนางนอน · Doi Nang Non",
        "mtn_p": [
            "Doi Nang Non, the Mountain of the Sleeping Lady, runs along the border with Myanmar above Mae Sai. From the right angle its ridge looks like a woman lying on her back. In the Tai Yai story, a princess fled her father with a commoner she loved; soldiers killed him, she died of grief, her blood became the Mae Sai River and her body the mountain.",
            "The mountain is limestone: rock that rainwater slowly dissolves. Over a very long time the water hollowed out Tham Luang, a cave about 10.3 km long. The mouth is 446 m above the sea; the peak is 1,389 m. In the rainy season the mountain soaks up rain like a sponge and lets it out through the cave. A sign at the mouth warned against going in from July to November. In 2018 the rain came early.",  # stylecheck: allow — history: the sign's own warning
            "The drawing above is the mountain in profile, made from six bell curves added together, one for each part of the Sleeping Lady. Press play to run the eighteen days.",
        ],
        "map_h": "The way in",
        "map_kick": "From the mouth to Nern Nom Sao",
        "map_p": [
            "Seen from above, the passage runs north from the mouth, west through three big chambers, then south past a T-junction to a sandy bank the rescuers named Pattaya Beach, after the seaside town. The team was on a ledge about 400 m past it: Nern Nom Sao.",
            "Cave divers lay a guideline, a thin rope, as they go, so they can follow it back by touch when they cannot see. John Volanthen ran out of line just short of the team, surfaced, and found them.",
            "How far in? The governor's briefing that night said 4 km from the mouth. Martin Ellis's survey map puts the ledge about 2.6 km in. This trace, a smooth curve through points copied from a public-domain sketch map, measures {trace}.",
        ],
        "lay": "Lay the line", "bring": "Bring them out", "dist": "Along the line", "stage": "Where",  # stylecheck: allow — a stage label
        "places": {"mouth": "Mouth", "c1": "Chamber 1", "c2": "Chamber 2", "c3": "Chamber 3 · base", "tj": "T-junction · Sam Yaek", "pb": "Pattaya Beach", "ledge": "Nern Nom Sao", "monk": "Monk's Series", "pumps": "pumps", "flooded": "flooded, dived", "dry": "walked"},
        "map_note": "Traced from Per Meistrup's CC0 map of the rescue, checked against Martin Ellis's 2018 survey. Where the water stood changed by the hour; blue sketches the stretches divers had to swim.",
        "sq_h": "The squeeze",
        "sq_kick": "38 × 72 cm",
        "sq_p": [
            "The tightest gap on the way out measured 38 by 72 cm. A football, size 5, is about 22 cm across. Three side by side fit through; a fourth does not. Stacked, two do not fit: the gap is less than two balls high.",
            "Each boy wore a full-face mask fed from an oxygen cylinder clipped to his chest. In a squeeze like this the diver pushed him through from behind, keeping his own head higher, so that in the dark his head hit the rock first. He checked the boy was breathing by the bubbles he could see and feel.",
        ],
        "sq_note": "Drawn to scale: 1 cm here is the same size everywhere on the picture. Football size from FIFA's Laws of the Game (68–70 cm round).",
        "wa_h": "The water",
        "wa_kick": "A billion litres",
        "wa_p": [
            "The rescue pumped more than a billion litres of water out of the cave and the lakes that drain it: as much as 400 Olympic swimming pools. A stone dam upstream turned streams away; pipes carried the water off, and flooded farmers' fields.",
            "On 4 July the pumps were pulling out 1.6 million litres an hour. Slide to run them: at that rate a billion litres takes 625 hours, 26 days. The rescue did not have 26 days. On 5 July a dry spell let the water drop about 1.5 cm an hour, and the plan had to work before the next rain.",
        ],
        "wa_hours": "Hours of pumping", "wa_l": "Litres out", "wa_pools": "Olympic pools", "wa_days": "Days",
        "wa_note": "An Olympic pool: 50 × 25 × 2 m = 2.5 million litres. A billion litres ÷ 2.5 million = 400 pools.",
        "air_h": "The air",
        "air_kick": "21% → 15%",
        "air_p": [
            "Air is about 21% oxygen. People work normally between 19.5% and 23.5%. By 8 July the air where the team sat measured 15%. Army engineers tried to run an air line in and gave up; it could not be done in time.",
            "Each dot in the jar is one part in a hundred of the air. Slide to watch the oxygen thin. Then count the breathing: a person at rest uses about a quarter of a litre of oxygen a minute. Thirteen people, and from 3 July four rescuers with them, use it up day after day in a pocket of air the mountain had sealed with water.",
        ],
        "air_o2": "Oxygen in the air", "air_ppl": "People breathing", "air_day": "Oxygen used a day", "air_air": "Air that held it",
        "air_note": "About 0.25 L of oxygen a minute is a resting adult's use (physiology textbooks). Children use less, so this is a high count. The air figure is the oxygen ÷ 0.21.",
        "out_h": "The way out",
        "out_kick": "Thirteen journeys, three days",
        "out_p": [
            "The team could not swim the way out awake: some could not swim at all, and panic underwater would kill a boy and his diver. So Dr Richard Harris, an Australian anaesthetist and cave diver, put each boy to sleep with ketamine. Each boy was tied to a lead diver, dressed in a wetsuit and a buoyancy jacket, with a mask over his whole face.",
            "One dose lasted 45 minutes to an hour, and the trip took three hours on the first day, so divers Harris had trained gave top-up injections on the way. The lead divers swam over a kilometre; on dry stretches support divers carried the boy on a stretcher, and the vet Craig Challen checked him before the next dive. From Chamber 3, hundreds of people passed each boy hand to hand, sliding and zip-lining him over the rocks to the mouth.",
            "The boys chose the order themselves: whoever lived furthest away would go first, so they could get home and tell everyone the others were all right. They thought they would be cycling home.",
        ],
        "out_note": "The sleep line is a sketch of 'each dose lasts 45 minutes to an hour', not a measured drug level. Journey times: three hours on the first day, a little over two on the last. Starts are 45 minutes apart, as the divers spaced them; the clock hour of the first start is a sketch.",
        "out_day": ["Day one · 8 July", "Day two · 9 July", "Day three · 10 July"],
        "out_seg": ["dive", "carried", "dive", "Chamber 3", "hand to hand"],
        "out_dose": "dose", "out_trip": "Journey", "out_h1": "first day", "out_h3": "last day",
        "team_h": "The Wild Boars",
        "team_p": "In the order they came out. Ages at the time. The coach and three of the boys had no nationality; they were made Thai citizens on 26 September 2018.",
        "age": "age", "order": "out",
        "pe_h": "The people",
        "pe_kick": "About ten thousand",
        "pe_p": [
            "About 10,000 people worked on the rescue: some 2,000 soldiers, 900 police, people from about 100 government agencies, more than 100 divers, and volunteers who cooked, cleaned, washed clothes and looked after the families. Ninety divers worked inside the cave, 40 from Thailand and 50 from abroad. Teams came from Australia, Belgium, Britain, Canada, China, Denmark, Finland, Israel, Japan, Laos, Myanmar, the United States, Ukraine and more.",
            "More than 700 air cylinders were used, 500 of them inside the cave at any one time while 200 waited to be refilled. The king later decorated 188 people for the rescue: 114 from abroad and 74 Thais.",
        ],
        "pe_note": "One dot, one person. Group sizes are the round numbers the reports give; the rest are everyone else who came.",
        "pe_groups": ["soldiers", "police", "divers in the cave", "everyone else"],
        "cyl": ["air cylinders in the cave", "waiting to be refilled"],
        "re_h": "Remembered",
        "re_kick": "ผู้ที่จากไป",
        "re_p": "After the last boy was out, the families, the commanders and thousands of volunteers gathered at the mouth to give thanks and to ask forgiveness of Jao Mae Tham, the goddess of the cave, for the pumps, the ropes and the people.",
        "people": [
            ("Saman Kunan", "น.ต. สมาน กุนัน · 1980–2018", "A former Navy SEAL, 37, who had left the service in 2006 and worked in security at Suvarnabhumi Airport. He volunteered. On the night of 5 July he dived from Chamber 3 toward the T-junction to leave three air tanks, lost consciousness on the way back, and was pronounced dead about 1 a.m. on 6 July. A bronze statue by Chalermchai Kositpipat, twice life size, stands at the cave with thirteen wild boars at his feet."),
            ("Beirut Pakbara", "ร.ท. เบรุต ปากบารา · died 2019", "A Navy SEAL diver in the rescue. He died in December 2019 of a blood infection he caught during the operation."),
            ("Duangphet “Dom” Phromthep", "ดวงเพชร (ดอม) พรหมเทพ · 2005–2023", "The team captain, rescued eighth, on day two. He died in England in February 2023, aged 17."),
            ("Erik Brown", "เอริก บราวน์ · died 2026", "A Canadian cave diver and instructor. He carried air cylinders and gear through the flooded passages, laid and kept up the guidelines, and spent 63 hours inside the cave over nine days and seven missions. Canada gave him the Medal of Bravery in 2019. Friends and family announced his death, at 44, in late September 2026. The cause has not been made public."),
        ],
        "boars": "Thirteen wild boars, for the thirteen at Saman Kunan's feet.",
        "ph_h": "Pictures",
        "ph_p": "Photographs in the public domain, and one of the cave mouth from Mot Dang.",
        "src_h": "Sources",
        "sources": [
            ("Tham Luang cave rescue, Wikipedia", "https://en.wikipedia.org/wiki/Tham_Luang_cave_rescue"),
            ("ปฏิบัติการค้นหาและกู้ภัยถ้ำหลวง, Thai Wikipedia", "https://th.wikipedia.org/wiki/%E0%B8%9B%E0%B8%8F%E0%B8%B4%E0%B8%9A%E0%B8%B1%E0%B8%95%E0%B8%B4%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%84%E0%B9%89%E0%B8%99%E0%B8%AB%E0%B8%B2%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%81%E0%B8%B9%E0%B9%89%E0%B8%A0%E0%B8%B1%E0%B8%A2%E0%B8%96%E0%B9%89%E0%B8%B3%E0%B8%AB%E0%B8%A5%E0%B8%A7%E0%B8%87"),
            ("Tham Luang Nang Non, Wikipedia", "https://en.wikipedia.org/wiki/Tham_Luang_Nang_Non"),
            ("Saman Kunan, Wikipedia", "https://en.wikipedia.org/wiki/Saman_Kunan"),
            ("Canadian diver who helped rescue Wild Boars dies at 44, Khaosod English, 1 Oct 2026", "https://www.khaosodenglish.com/news/2026/10/01/canadian-diver-who-helped-rescue-wild-boars-dies-at-44/"),
            ("Reports emerge of Tham Luang rescue diver Erik Brown's death, The Scuba News, 25 Sep 2026", "https://www.thescubanews.com/2026/09/25/erik-brown-tham-luang-cave-rescue-diver-death/"),
            ("Canadian diver who helped save trapped Thai football team dies at 44, Malay Mail, 3 Oct 2026", "https://www.malaymail.com/news/life/2026/10/03/canadian-diver-who-helped-save-trapped-thai-football-team-in-chiang-rai-cave-dies-at-44/237502"),
            ("Tham Luang rescue map, Per Meistrup, CC0 (the trace)", "https://commons.wikimedia.org/wiki/File:2018_Tham-Luang-cave-map-cropped.png"),
            ("Tham Luang 2018 rescue map after Martin Ellis's survey (distances)", "https://commons.wikimedia.org/wiki/File:Tham_Luang_2018_Cave_Rescue_Map.png"),
            ("Laws of the Game, Law 2: the ball, IFAB", "https://www.theifab.com/laws/latest/the-ball/"),
        ],
        "mot": "Tham Luang on Mot Dang",
        "foot": "Text CC BY 4.0, NaNoBotCo. Code MIT. Photographs keep their own licences.",
        "desc": "The 2018 Tham Luang cave rescue drawn with math: the Sleeping Lady mountain, the flooded way in, the 38 × 72 cm squeeze, a billion litres of water, the thinning air, the way out, the ten thousand people, and those we remember, including diver Erik Brown.",
        "lang_other": ("th/", "ไทย", "th"), "lang_this": "EN",
        "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        "inside": "{n} inside", "out_n": "{n} out", "day_n": "Day {d} of 18",
    },
    "th": {
        "title": "ถ้ำหลวง วาดด้วยคณิต",
        "other_title": "Tham Luang, Drawn",
        "kicker": "Tham Luang · เชียงราย · มิถุนายน–กรกฎาคม 2561",
        "lede": "สิบสามชีวิตติดอยู่ในภูเขาที่น้ำท่วมสิบแปดวัน และคนราวหนึ่งหมื่นคนพาพวกเขากลับบ้านได้อย่างไร วาดจากตัวเลขจริง",
        "cardline": "Tham Luang · หมูป่ากลับบ้าน",
        "nav": [("mountain", "ดอย"), ("map", "แผนที่"), ("squeeze", "ช่องแคบ"), ("water", "น้ำ"), ("air", "อากาศ"), ("out", "ทางออก"), ("people", "ผู้คน"), ("remembered", "รำลึก"), ("pictures", "ภาพ"), ("sources", "ที่มา")],
        "play": "เล่น", "pause": "หยุด", "slider": "วัน",
        "hero_note": "ไม่ตามมาตราส่วน ความสูงยืดให้เห็นถ้ำ ฝนและระดับน้ำตามข่าวรายวัน ไม่ใช่ค่าจากเครื่องวัด จุดไฟแต่ละดวงคือคนหนึ่งคน",
        "mtn_h": "ดอยนางนอน",
        "mtn_kick": "Doi Nang Non · ภูเขานางนอน",
        "mtn_p": [
            "ดอยนางนอนทอดตัวตามแนวชายแดนพม่าเหนืออำเภอแม่สาย มองจากบางมุมสันดอยเหมือนหญิงสาวนอนหงาย ตำนานไทใหญ่เล่าว่าเจ้าหญิงหนีพ่อไปกับชายสามัญที่นางรัก ทหารตามมาฆ่าเขา นางตรอมใจตาย เลือดกลายเป็นแม่น้ำแม่สาย ร่างกลายเป็นภูเขา",
            "ดอยนี้เป็นหินปูน หินที่น้ำฝนค่อยๆ ละลายได้ นานแสนนานน้ำกัดเซาะจนเกิดถ้ำหลวง ยาวราว 10.3 กม. ปากถ้ำสูงจากน้ำทะเล 446 เมตร ยอดดอยสูง 1,389 เมตร หน้าฝนภูเขาดูดซับน้ำเหมือนฟองน้ำแล้วปล่อยออกทางถ้ำ ป้ายหน้าถ้ำเตือนว่าห้ามเข้าช่วงกรกฎาคมถึงพฤศจิกายน ปี 2561 ฝนมาเร็วกว่าปกติ",  # stylecheck: allow — history: the sign's own warning
            "ภาพด้านบนคือภูเขามองด้านข้าง สร้างจากเส้นโค้งระฆังหกเส้นบวกกัน หนึ่งเส้นต่อหนึ่งส่วนของนางนอน กดเล่นเพื่อดูสิบแปดวัน",
        ],
        "map_h": "ทางเข้า",
        "map_kick": "จากปากถ้ำถึงเนินนมสาว",
        "map_p": [
            "มองจากด้านบน ทางเดินจากปากถ้ำไปทางเหนือ เลี้ยวตะวันตกผ่านโถงใหญ่สามโถง แล้วลงใต้ผ่านสามแยก ถึงลานทรายที่ทีมกู้ภัยตั้งชื่อว่าหาดพัทยา ทีมหมูป่าอยู่บนเนินเลยไปราว 400 เมตร ชื่อเนินนมสาว",
            "นักดำน้ำถ้ำวางเชือกนำทางเส้นเล็กไปตลอดทาง เพื่อคลำตามกลับได้เมื่อมองไม่เห็น จอห์น โวลันเธน เชือกหมดก่อนถึงทีมนิดเดียว โผล่ขึ้นมา แล้วก็พบพวกเขา",
            "ไกลแค่ไหน ผู้ว่าฯ แถลงคืนนั้นว่า 4 กม. จากปากถ้ำ แผนที่สำรวจของมาร์ติน เอลลิส บอกว่าราว 2.6 กม. เส้นนี้เป็นเส้นโค้งเรียบลากผ่านจุดที่คัดจากแผนที่สาธารณะ วัดได้ {trace}",
        ],
        "lay": "วางเชือก", "bring": "พาออกมา", "dist": "ระยะตามเชือก", "stage": "ตรงไหน",
        "places": {"mouth": "ปากถ้ำ", "c1": "โถง 1", "c2": "โถง 2", "c3": "โถง 3 · ฐาน", "tj": "สามแยก", "pb": "หาดพัทยา", "ledge": "เนินนมสาว", "monk": "ทางพระ (Monk's Series)", "pumps": "เครื่องสูบน้ำ", "flooded": "น้ำท่วม ต้องดำ", "dry": "เดินได้"},
        "map_note": "ลากตามแผนที่ CC0 ของ Per Meistrup เทียบกับแผนที่สำรวจของมาร์ติน เอลลิส ปี 2561 ระดับน้ำเปลี่ยนทุกชั่วโมง สีฟ้าคือภาพร่างช่วงที่นักดำน้ำต้องดำ",
        "sq_h": "ช่องแคบ",
        "sq_kick": "38 × 72 ซม.",
        "sq_p": [
            "ช่องแคบที่สุดบนทางออกกว้าง 38 คูณ 72 ซม. ลูกฟุตบอลเบอร์ 5 กว้างราว 22 ซม. วางเรียงกันได้สามลูก ลูกที่สี่ไม่พอ วางซ้อนกันสองลูกก็ไม่ผ่าน ช่องสูงไม่ถึงสองลูก",
            "เด็กแต่ละคนสวมหน้ากากเต็มหน้า ต่อกับถังออกซิเจนที่หนีบไว้ที่หน้าอก ในช่องแคบแบบนี้ นักดำน้ำดันเด็กจากข้างหลัง ให้ศีรษะตัวเองอยู่สูงกว่า เพื่อให้ในความมืดหัวตัวเองชนหินก่อน และคอยดูว่าเด็กยังหายใจ จากฟองอากาศที่เห็นและสัมผัสได้",
        ],
        "sq_note": "วาดตามมาตราส่วน 1 ซม. เท่ากันทั้งภาพ ขนาดลูกฟุตบอลจากกติกาฟุตบอลของ FIFA (เส้นรอบวง 68–70 ซม.)",
        "wa_h": "น้ำ",
        "wa_kick": "หนึ่งพันล้านลิตร",
        "wa_p": [
            "ปฏิบัติการนี้สูบน้ำออกจากถ้ำและหนองน้ำที่ระบายน้ำจากถ้ำกว่าหนึ่งพันล้านลิตร เท่ากับสระว่ายน้ำโอลิมปิก 400 สระ ฝายหินด้านบนเบนลำธารออก ท่อพาน้ำไปทิ้ง จนท่วมไร่นาชาวบ้าน",
            "วันที่ 4 กรกฎาคม เครื่องสูบดูดน้ำออกชั่วโมงละ 1.6 ล้านลิตร เลื่อนดูว่าสูบนานแค่ไหน ที่อัตรานี้ หนึ่งพันล้านลิตรใช้ 625 ชั่วโมง คือ 26 วัน ทีมกู้ภัยไม่มีเวลา 26 วัน วันที่ 5 กรกฎาคม ฝนหยุด น้ำลดราวชั่วโมงละ 1.5 ซม. แผนต้องสำเร็จก่อนฝนรอบหน้า",
        ],
        "wa_hours": "ชั่วโมงที่สูบ", "wa_l": "ลิตรที่ออก", "wa_pools": "สระโอลิมปิก", "wa_days": "วัน",
        "wa_note": "สระโอลิมปิก 50 × 25 × 2 เมตร = 2.5 ล้านลิตร หนึ่งพันล้าน ÷ 2.5 ล้าน = 400 สระ",
        "air_h": "อากาศ",
        "air_kick": "21% → 15%",
        "air_p": [
            "อากาศมีออกซิเจนราว 21% คนทำงานได้ปกติระหว่าง 19.5% ถึง 23.5% ถึงวันที่ 8 กรกฎาคม อากาศตรงที่ทีมหมูป่านั่งอยู่วัดได้ 15% ทหารช่างพยายามต่อสายส่งอากาศเข้าไป แต่ต้องเลิก ทำไม่ทัน",
            "จุดแต่ละจุดในโหลคือหนึ่งส่วนในร้อยของอากาศ เลื่อนดูออกซิเจนที่บางลง แล้วลองนับลมหายใจ คนนั่งเฉยๆ ใช้ออกซิเจนราวนาทีละหนึ่งในสี่ลิตร สิบสามคน และตั้งแต่ 3 กรกฎาคมมีเจ้าหน้าที่อีกสี่คน ใช้ออกซิเจนไปทุกวันในโพรงอากาศที่น้ำปิดไว้",
        ],
        "air_o2": "ออกซิเจนในอากาศ", "air_ppl": "คนที่หายใจ", "air_day": "ออกซิเจนที่ใช้ต่อวัน", "air_air": "อากาศที่มีออกซิเจนเท่านั้น",
        "air_note": "ราว 0.25 ลิตรต่อนาทีคือที่ผู้ใหญ่ใช้ขณะพัก (ตำราสรีรวิทยา) เด็กใช้น้อยกว่า ตัวเลขนี้จึงเป็นค่าสูง อากาศ = ออกซิเจน ÷ 0.21",
        "out_h": "ทางออก",
        "out_kick": "สิบสามเที่ยว สามวัน",
        "out_p": [
            "ทีมหมูป่าว่ายออกมาเองตอนตื่นไม่ได้ บางคนว่ายน้ำไม่เป็นเลย และถ้าตกใจใต้น้ำ ทั้งเด็กและนักดำน้ำอาจตาย นพ.ริชาร์ด แฮร์ริส วิสัญญีแพทย์และนักดำน้ำถ้ำชาวออสเตรเลีย จึงให้ยาคีตามีนให้เด็กแต่ละคนหลับ เด็กแต่ละคนผูกติดกับนักดำน้ำนำ สวมชุดเว็ตสูท เสื้อชูชีพ และหน้ากากเต็มหน้า",
            "ยาหนึ่งเข็มอยู่ได้ 45 นาทีถึงชั่วโมง วันแรกทั้งเที่ยวใช้สามชั่วโมง นักดำน้ำที่หมอแฮร์ริสฝึกไว้จึงฉีดเพิ่มระหว่างทาง นักดำน้ำนำว่ายไปกว่าหนึ่งกิโลเมตร ช่วงที่แห้ง นักดำน้ำสนับสนุนหามเด็กบนเปล และสัตวแพทย์เครก ชาลเลน ตรวจก่อนดำช่วงต่อไป จากโถงสาม คนหลายร้อยส่งเด็กต่อมือกัน ลากเลื่อน และโรยสลิงข้ามหินจนถึงปากถ้ำ",
            "เด็กๆ เลือกลำดับเอง ใครบ้านไกลที่สุดได้ออกก่อน จะได้กลับไปบอกทุกคนว่าคนที่เหลือปลอดภัย พวกเขาคิดว่าจะต้องปั่นจักรยานกลับบ้าน",
        ],
        "out_note": "เส้นหลับเป็นภาพร่างจาก 'ยาหนึ่งเข็มอยู่ได้ 45 นาทีถึงชั่วโมง' ไม่ใช่ระดับยาที่วัดจริง เวลาเดินทาง สามชั่วโมงในวันแรก สองชั่วโมงกว่าในวันสุดท้าย ออกห่างกันคนละ 45 นาทีตามที่นักดำน้ำทำ ส่วนเวลาเริ่มของคนแรกเป็นภาพร่าง",
        "out_day": ["วันแรก · 8 ก.ค.", "วันที่สอง · 9 ก.ค.", "วันที่สาม · 10 ก.ค."],
        "out_seg": ["ดำน้ำ", "หามเปล", "ดำน้ำ", "โถง 3", "ส่งต่อมือ"],
        "out_dose": "เข็ม", "out_trip": "เวลาเดินทาง", "out_h1": "วันแรก", "out_h3": "วันสุดท้าย",
        "team_h": "ทีมหมูป่า",
        "team_p": "เรียงตามลำดับที่ออกมา อายุในตอนนั้น โค้ชและเด็กสามคนไม่มีสัญชาติ ได้สัญชาติไทยเมื่อ 26 กันยายน 2561",
        "age": "อายุ", "order": "ออกคนที่",
        "pe_h": "ผู้คน",
        "pe_kick": "ราวหนึ่งหมื่นคน",
        "pe_p": [
            "คนราว 10,000 คนร่วมกู้ภัย ทหารราว 2,000 นาย ตำรวจ 900 นาย คนจากหน่วยงานรัฐราว 100 หน่วย นักดำน้ำกว่า 100 คน และอาสาสมัครที่ทำอาหาร ทำความสะอาด ซักผ้า ดูแลครอบครัว นักดำน้ำ 90 คนทำงานในถ้ำ เป็นคนไทย 40 คน ต่างชาติ 50 คน ทีมมาจากออสเตรเลีย เบลเยียม อังกฤษ แคนาดา จีน เดนมาร์ก ฟินแลนด์ อิสราเอล ญี่ปุ่น ลาว พม่า สหรัฐฯ ยูเครน และอีกหลายประเทศ",
            "ใช้ถังอากาศกว่า 700 ถัง อยู่ในถ้ำครั้งละ 500 ถัง อีก 200 รอเติม ต่อมาในหลวงพระราชทานเครื่องราชอิสริยาภรณ์แก่ผู้ร่วมกู้ภัย 188 คน ต่างชาติ 114 คน คนไทย 74 คน",
        ],
        "pe_note": "หนึ่งจุด หนึ่งคน ขนาดกลุ่มเป็นตัวเลขกลมๆ ตามข่าว ที่เหลือคือทุกคนที่มาช่วย",
        "pe_groups": ["ทหาร", "ตำรวจ", "นักดำน้ำในถ้ำ", "ทุกคนที่มาช่วย"],
        "cyl": ["ถังอากาศในถ้ำ", "รอเติม"],
        "re_h": "รำลึก",
        "re_kick": "Remembered",
        "re_p": "เมื่อเด็กคนสุดท้ายออกมา ครอบครัว ผู้บัญชาการ และอาสาสมัครหลายพันคนมารวมกันที่ปากถ้ำ ขอบคุณ และขอขมาเจ้าแม่ถ้ำ ที่เครื่องสูบน้ำ เชือก และผู้คนรบกวนถ้ำ",
        "people": [
            ("น.ต. สมาน กุนัน", "Saman Kunan · 2523–2561", "จ่าแซม อดีตหน่วยซีล อายุ 37 ปี ออกจากราชการปี 2549 ทำงานรักษาความปลอดภัยที่สนามบินสุวรรณภูมิ อาสามาช่วย คืนวันที่ 5 กรกฎาคม ดำจากโถงสามไปทางสามแยกเพื่อวางถังอากาศสามถัง หมดสติขณะดำกลับ เสียชีวิตราวตีหนึ่งวันที่ 6 กรกฎาคม รูปปั้นสำริดสองเท่าคนจริงโดยเฉลิมชัย โฆษิตพิพัฒน์ ตั้งอยู่ที่ถ้ำ มีหมูป่าสิบสามตัวอยู่ที่เท้า"),
            ("ร.ท. เบรุต ปากบารา", "Beirut Pakbara · เสียชีวิต 2562", "นักดำน้ำหน่วยซีลในปฏิบัติการ เสียชีวิตเดือนธันวาคม 2562 จากการติดเชื้อในกระแสเลือดที่ได้รับระหว่างปฏิบัติการ"),
            ("ดวงเพชร (ดอม) พรหมเทพ", "Duangphet “Dom” Phromthep · 2548–2566", "กัปตันทีม ออกมาเป็นคนที่แปด ในวันที่สอง เสียชีวิตที่อังกฤษเมื่อกุมภาพันธ์ 2566 อายุ 17 ปี"),
            ("เอริก บราวน์", "Erik Brown · เสียชีวิต 2569", "นักดำน้ำถ้ำและครูสอนดำน้ำชาวแคนาดา ขนถังอากาศและอุปกรณ์ผ่านช่วงน้ำท่วม วางและดูแลเชือกนำทาง อยู่ในถ้ำรวม 63 ชั่วโมง ในเก้าวัน เจ็ดภารกิจ แคนาดามอบเหรียญความกล้าหาญ (Medal of Bravery) ให้ในปี 2562 ครอบครัวและเพื่อนแจ้งข่าวการเสียชีวิต อายุ 44 ปี ปลายเดือนกันยายน 2569 ยังไม่มีการเปิดเผยสาเหตุ"),
        ],
        "boars": "หมูป่าสิบสามตัว แทนสิบสามตัวที่เท้าจ่าแซม",
        "ph_h": "ภาพ",
        "ph_p": "ภาพถ่ายสาธารณสมบัติ และภาพปากถ้ำหนึ่งภาพจากมดแดง",
        "src_h": "ที่มา",
        "mot": "ถ้ำหลวงบนมดแดง",
        "foot": "ข้อความ CC BY 4.0, NaNoBotCo โค้ด MIT ภาพถ่ายใช้สัญญาอนุญาตของภาพนั้น",
        "desc": "ปฏิบัติการกู้ภัยถ้ำหลวงปี 2561 วาดด้วยคณิตศาสตร์ ดอยนางนอน ทางเข้าที่น้ำท่วม ช่องแคบ 38 × 72 ซม. น้ำพันล้านลิตร อากาศที่บางลง ทางออก ผู้คนหนึ่งหมื่น และผู้ที่จากไป รวมถึงนักดำน้ำเอริก บราวน์",
        "lang_other": ("../", "EN", "en"), "lang_this": "ไทย",
        "months": ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
        "inside": "อยู่ข้างใน {n}", "out_n": "ออกมาแล้ว {n}", "day_n": "วันที่ {d} จาก 18",
    },
}
UI["th"]["sources"] = UI["en"]["sources"]


def paras(ps, **kw):
    return "".join(f"<p>{E(p.format(**kw) if kw else p)}</p>" for p in ps)


def page(lang):
    u = UI[lang]
    root = "" if lang == "en" else "../"
    url = BASE if lang == "en" else BASE + "th/"
    js = {k: u[k] for k in ("play", "pause", "places", "out_seg", "out_dose", "out_trip", "out_h1", "out_h3", "pe_groups", "cyl", "months", "inside", "out_n", "day_n", "dist", "stage")}
    js["lang"] = lang
    js["days"] = [d[1] for d in DAYS[lang]]
    js["dlabel"] = [d[0] for d in DAYS[lang]]
    js["team"] = [t[3] if lang == "th" else t[2] for t in TEAM]
    nav = "".join(f'<a href="#{a}">{E(b)}</a>' for a, b in u["nav"])
    ol = u["lang_other"]
    head = f'''<!doctype html><html lang="{lang}" translate="no" class="notranslate"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="google" content="notranslate">
{GOOGLE_ESCAPE}
<title>{E(u["title"])} · {E(u["other_title"])}</title>
<meta name="description" content="{E(u["desc"])}">
<meta name="theme-color" content="#0c1316">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="en" href="{BASE}"><link rel="alternate" hreflang="th" href="{BASE}th/"><link rel="alternate" hreflang="x-default" href="{BASE}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Tham Luang, Drawn · ถ้ำหลวง วาดด้วยคณิต">
<meta property="og:title" content="{E(u["title"])}"><meta property="og:description" content="{E(u["desc"])}"><meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}card.jpg"><meta property="og:image:secure_url" content="{BASE}card.jpg"><meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Doi Nang Non drawn in profile with the flooded cave beneath and thirteen lights on a ledge">
<meta property="og:locale" content="{"en_US" if lang == "en" else "th_TH"}"><meta property="og:locale:alternate" content="{"th_TH" if lang == "en" else "en_US"}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{BASE}card.jpg">
<link rel="icon" href="{root}icon.svg" type="image/svg+xml">
<link rel="alternate" type="text/plain" href="{BASE}llms.txt" title="llms.txt">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Noto+Sans+Thai:wght@400;600;700&family=Noto+Serif+Thai:wght@600;700&display=swap" rel="stylesheet">
<script>if(/[?&]card/.test(location.search))document.documentElement.classList.add("card")</script>
<style>{CSS}</style>
</head><body>
<header class="top"><div class="in"><a class="brand" href="#top"><svg viewBox="0 0 32 32" aria-hidden="true"><use href="#mark"/></svg><span>{E(u["title"])}</span></a>
<nav aria-label="Sections">{nav}</nav>
<span class="lang"><b>{E(u["lang_this"])}</b> | <a href="{ol[0]}" hreflang="{ol[2]}">{E(ol[1])}</a></span></div></header>
<svg width="0" height="0" style="position:absolute"><symbol id="mark" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#0c1316"/><path d="M3 22c4-2 6-8 9-8s3 3 6 3 4-6 7-6 3 5 4 11z" fill="#2a363b"/><path d="M8 24c3-2 7-2 9-1s5 1 8-1" stroke="#3db3c8" stroke-width="2" fill="none"/><circle cx="21" cy="21" r="1.6" fill="#ffc85a"/></symbol></svg>
'''
    hero = f'''<section id="top" class="hero"><canvas id="scene" role="img" aria-label="{E(u["lede"])}"></canvas>
<div class="hero-t"><p class="kick">{E(u["kicker"])}</p><h1>{E(u["title"])}</h1><p class="lede">{E(u["lede"])}</p><p class="cardline">{E(u["cardline"])}<br><span>nanobotco.github.io/tham-luang</span></p></div>
<div class="tbar"><button id="tplay" class="pill hot" type="button">{E(u["pause"])}</button><label for="tday" class="sr">{E(u["slider"])}</label><input id="tday" type="range" min="0" max="432" step="0.25" value="0"><span id="tdate" class="tdate" aria-live="polite"></span>
<p id="tev" class="tev" aria-live="polite"></p><p class="note">{E(u["hero_note"])}</p></div></section>
'''
    days = "".join(f'<li data-d="{i}"><b>{E(d)}</b>{E(t[:90] + ("…" if len(t) > 90 else ""))}</li>' for i, (d, t) in enumerate(DAYS[lang]))
    mountain = f'''<section id="mountain" class="sec rock"><div class="in"><p class="kick">{E(u["mtn_kick"])}</p><h2>{E(u["mtn_h"])}</h2>{paras(u["mtn_p"])}
<ol class="days">{days}</ol></div></section>
'''
    mp = f'''<section id="map" class="sec dark"><div class="in"><p class="kick">{E(u["map_kick"])}</p><h2>{E(u["map_h"])}</h2>
<canvas id="plan" class="cv" role="img" aria-label="{E(u["map_h"])}"></canvas>
<div class="btns"><button id="mlay" class="pill hot" type="button">{E(u["lay"])}</button><button id="mout" class="pill" type="button">{E(u["bring"])}</button></div>
<input id="mpos" type="range" min="0" max="1000" value="0" aria-label="{E(u["dist"])}">
<div class="readout"><div><span>{E(u["dist"])}</span><b id="mdist">0 m</b></div><div><span>{E(u["stage"])}</span><b id="mwhere">–</b></div></div>
{paras(u["map_p"], trace='<span class="trace">2.5 km</span>')}<p class="note">{E(u["map_note"])} <a href="https://motdang.net/chiang-rai/see/#tham-luang">{E(u["mot"])}</a></p></div></section>
'''
    mp = mp.replace("&lt;span class=&quot;trace&quot;&gt;2.5 km&lt;/span&gt;", '<span class="trace">2.5 km</span>')
    sq = f'''<section id="squeeze" class="sec"><div class="in two"><div><canvas id="squeezecv" class="cv" role="img" aria-label="{E(u["sq_h"])}"></canvas><p class="note">{E(u["sq_note"])}</p></div>
<div><p class="kick">{E(u["sq_kick"])}</p><h2>{E(u["sq_h"])}</h2>{paras(u["sq_p"])}</div></div></section>
'''
    wa = f'''<section id="water" class="sec dark"><div class="in two"><div><canvas id="pools" class="cv" role="img" aria-label="{E(u["wa_h"])}"></canvas></div>
<div><p class="kick">{E(u["wa_kick"])}</p><h2>{E(u["wa_h"])}</h2>{paras(u["wa_p"])}
<label class="lab" for="whours">{E(u["wa_hours"])}</label><input id="whours" type="range" min="0" max="625" step="1" value="0">
<div class="readout"><div><span>{E(u["wa_hours"])}</span><b id="wh">0</b></div><div><span>{E(u["wa_l"])}</span><b id="wl">0</b></div><div><span>{E(u["wa_pools"])}</span><b id="wp">0</b></div><div><span>{E(u["wa_days"])}</span><b id="wd">0</b></div></div>
<p class="note">{E(u["wa_note"])}</p></div></div></section>
'''
    air = f'''<section id="air" class="sec"><div class="in two"><div><canvas id="jar" class="cv" role="img" aria-label="{E(u["air_h"])}"></canvas></div>
<div><p class="kick">{E(u["air_kick"])}</p><h2>{E(u["air_h"])}</h2>{paras(u["air_p"])}
<label class="lab" for="ao2">{E(u["air_o2"])}: <b id="ao2v">21%</b></label><input id="ao2" type="range" min="15" max="21" step="0.1" value="21">
<label class="lab" for="appl">{E(u["air_ppl"])}: <b id="apv">13</b></label><input id="appl" type="range" min="1" max="17" step="1" value="13">
<div class="readout"><div><span>{E(u["air_day"])}</span><b id="aday">–</b></div><div><span>{E(u["air_air"])}</span><b id="aair">–</b></div></div>
<p class="note">{E(u["air_note"])}</p></div></div></section>
'''
    boys = []
    for i, (en, th, nen, nth, age, day) in enumerate(TEAM):
        if i == 0 or TEAM[i - 1][5] != day:
            boys.append(f'<p class="dayh">{E(u["out_day"][day - 1])}</p>')
        nick, other = (nth, f"{en} · {nen}") if lang == "th" else (nen, f"{th} · {nth}")
        name = th if lang == "th" else en
        note = TEAM_NOTE[lang].get(nen, "")
        cls = " coach" if nen == "Ekk" else ""
        boys.append(f'<div class="boy{cls}"><span class="n">{i + 1}</span><b>{E(nick)}</b><span class="th">{E(name)} · {E(u["age"])} {age}</span><span class="d">{E(other)}{(" · " + E(note)) if note else ""}</span></div>')
    out = f'''<section id="out" class="sec rock"><div class="in"><p class="kick">{E(u["out_kick"])}</p><h2>{E(u["out_h"])}</h2>{paras(u["out_p"])}
<canvas id="trip" class="cv" role="img" aria-label="{E(u["out_h"])}"></canvas><p class="note">{E(u["out_note"])}</p></div></section>
<section id="team" class="sec"><div class="in"><h2>{E(u["team_h"])}</h2><p>{E(u["team_p"])}</p><div class="team">{"".join(boys)}</div></div></section>
'''
    pe = f'''<section id="people" class="sec dark"><div class="in"><p class="kick">{E(u["pe_kick"])}</p><h2>{E(u["pe_h"])}</h2>{paras(u["pe_p"])}
<canvas id="crowd" class="cv" role="img" aria-label="{E(u["pe_h"])}"></canvas><p class="note">{E(u["pe_note"])}</p>
<canvas id="cyl" class="cv" role="img" aria-label="{E(" · ".join(u["cyl"]))}" style="margin-top:18px"></canvas></div></section>
'''
    mem = "".join(f'<article><canvas class="candle" aria-hidden="true"></canvas><h3>{E(a)}</h3><p class="th">{E(b)}</p><p>{E(c)}</p></article>' for a, b, c in u["people"])
    re_ = f'''<section id="remembered" class="sec rock"><div class="in"><p class="kick">{E(u["re_kick"])}</p><h2>{E(u["re_h"])}</h2><p>{E(u["re_p"])}</p>
<div class="mem">{mem}</div><canvas id="boars" class="boars" role="img" aria-label="{E(u["boars"])}"></canvas><p class="note">{E(u["boars"])}</p></div></section>
'''
    figs = []
    for f, w, h, page_, who, lic, licu, cap in PHOTOS:
        licl = f'<a href="{licu}">{E(lic)}</a>' if licu else E(lic)
        figs.append(f'<figure><img loading="lazy" src="{root}img/{f}" width="{w}" height="{h}" alt="{E(cap[lang])}"><figcaption>{E(cap[lang])} <a href="{page_}">{E(who)}</a> · {licl}</figcaption></figure>')
    ph = f'''<section id="pictures" class="sec"><div class="in"><h2>{E(u["ph_h"])}</h2><p>{E(u["ph_p"])}</p><div class="ph">{"".join(figs)}</div></div></section>
'''
    src = "".join(f'<li><a href="{h}">{E(t)}</a></li>' for t, h in u["sources"])
    so = f'''<section id="sources" class="sec"><div class="in"><h2>{E(u["src_h"])}</h2><ul class="src">{src}</ul></div></section>
'''
    tail = f'''<footer class="bot"><div class="in">{E(u["foot"])} · <a href="https://github.com/NaNoBotCo/tham-luang">GitHub</a> · <a href="https://motdang.net/">motdang.net</a> · <a href="https://hongdam.net/">hongdam.net</a></div></footer>
<script>window.UI={json.dumps(js, ensure_ascii=False)};</script>
<script src="{root}app.js"></script><script src="{root}top.js"></script>
</body></html>
'''
    return head + "<main>" + hero + mountain + mp + sq + wa + air + out + pe + re_ + ph + so + "</main>" + tail


def main():
    os.makedirs(os.path.join(DOCS, "th"), exist_ok=True)
    for lang, path in (("en", "index.html"), ("th", "th/index.html")):
        with open(os.path.join(DOCS, path), "w") as f:
            f.write(page(lang))
    with open(os.path.join(DOCS, "sitemap.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                f'<url><loc>{BASE}</loc></url>\n<url><loc>{BASE}th/</loc></url>\n</urlset>\n')
    with open(os.path.join(DOCS, "robots.txt"), "w") as f:
        f.write(f"User-agent: *\nAllow: /\nSitemap: {BASE}sitemap.xml\n")
    u = UI["en"]
    lines = ["# Tham Luang, Drawn · ถ้ำหลวง วาดด้วยคณิต", "", u["desc"], "", f"English: {BASE}", f"Thai: {BASE}th/", "", "## Eighteen days", ""]
    lines += [f"- {d} 2018: {t}" for d, t in DAYS["en"]]
    lines += ["", "## The thirteen, in the order they came out", ""]
    lines += [f"- {i + 1}. {nen} ({nth}), {en} ({th}), age {age}, day {day}" for i, (en, th, nen, nth, age, day) in enumerate(TEAM)]
    lines += ["", "## Remembered", ""] + [f"- {a} ({b}): {c}" for a, b, c in u["people"]]
    lines += ["", "## Sources", ""] + [f"- {t}: {h}" for t, h in u["sources"]]
    lines += ["", "## Licence", "", "Text CC BY 4.0, NaNoBotCo. Code MIT. Photographs keep their own licences, listed on the page.", ""]
    with open(os.path.join(DOCS, "llms.txt"), "w") as f:
        f.write("\n".join(lines))
    print("built en + th")


if __name__ == "__main__":
    main()
