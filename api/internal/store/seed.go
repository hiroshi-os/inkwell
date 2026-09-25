package store

func (s *Store) Seed() error {
	var n int
	if err := s.DB.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&n); err != nil {
		return err
	}
	if n > 0 {
		return nil
	}

	iris, err := s.CreateUser("iris", "iris@inkwell.example", "password123", "Iris Vale")
	if err != nil {
		return err
	}
	niko, err := s.CreateUser("niko", "niko@inkwell.example", "password123", "Niko Hart")
	if err != nil {
		return err
	}
	reader, err := s.CreateUser("reader", "reader@inkwell.example", "password123", "River Quinn")
	if err != nil {
		return err
	}
	_, _ = s.DB.Exec(s.q(`UPDATE users SET bio = ? WHERE id = ?`),
		"Writes lantern-lit fantasy between ferry commutes. Collects spare wicks.", iris.ID)
	_, _ = s.DB.Exec(s.q(`UPDATE users SET bio = ? WHERE id = ?`),
		"Harbor towns, copper coins, and weather that argues with the tide.", niko.ID)
	_, _ = s.DB.Exec(s.q(`UPDATE users SET bio = ? WHERE id = ?`),
		"Here for the next chapter. Always.", reader.ID)

	lantern, err := s.CreateStory(iris.ID, "The Last Lantern",
		"In a harbor city that rations light after dusk, an apprentice wick-keeper inherits a lantern that will not go out — and a debt the city would rather forget.",
		"Fantasy", "published", 152)
	if err != nil {
		return err
	}
	if _, err := s.CreateChapter(lantern.ID, iris.ID, "Wick", lanternCh1, true); err != nil {
		return err
	}
	if _, err := s.CreateChapter(lantern.ID, iris.ID, "Harbor Wind", lanternCh2, true); err != nil {
		return err
	}
	if _, err := s.CreateChapter(lantern.ID, iris.ID, "Oil and Oath", lanternCh3, true); err != nil {
		return err
	}

	letters, err := s.CreateStory(iris.ID, "Letters at Dusk",
		"A night clerk at a railway post office starts forwarding letters that were never meant to arrive — until one is addressed to her, in her own handwriting.",
		"Contemporary", "published", 28)
	if err != nil {
		return err
	}
	if _, err := s.CreateChapter(letters.ID, iris.ID, "Box 214", lettersCh1, true); err != nil {
		return err
	}
	if _, err := s.CreateChapter(letters.ID, iris.ID, "The Wrong Train", lettersCh2, true); err != nil {
		return err
	}

	salt, err := s.CreateStory(niko.ID, "Salt and Copper",
		"An assay clerk in a fog-bound port discovers the ledgers have been counting ships that never docked — and one that shouldn't still be afloat.",
		"Mystery", "published", 200)
	if err != nil {
		return err
	}
	if _, err := s.CreateChapter(salt.ID, niko.ID, "The Assay", saltCh1, true); err != nil {
		return err
	}
	if _, err := s.CreateChapter(salt.ID, niko.ID, "Low Tide Ledger", saltCh2, true); err != nil {
		return err
	}

	if err := s.Follow(reader.ID, iris.ID); err != nil {
		return err
	}
	return s.AddLibrary(reader.ID, lantern.ID)
}

const lanternCh1 = `The city issued light the way other cities issued bread: by ticket, by hour, by the length of a wick.

Mara took the last lantern from the rack because no one else would. It was older than the ordinance, heavier than the brass ones the guild preferred, and it burned with a patience that made the inspectors nervous. "If it does not gutter," her aunt had said, "do not thank it. Find out what it is owed."

She walked the quay with the lantern hooded, the way the law required after ninth bell. Windows were slits. Cats were rumors. The harbor lay like a held breath. When she uncovered the glass at the end of Pier Seven, the flame did not leap. It simply was — a quiet coin of gold that made the wet planks look briefly honest.

A man in a customs coat stopped walking. "That light isn't on the roster," he said.

"It's on mine," Mara answered, which was not yet a lie, only an intention.`

const lanternCh2 = `Wind off the water had a habit of stealing names. Mara learned this the night the lantern refused the guild's measured oil and burned anyway.

She sat on an overturned crate behind the net loft and dripped the official allotment into the reservoir. The flame did not brighten. It did not dim. It watched her, if a flame can watch, with the manners of something very old pretending to be useful.

Her aunt's notebook — the one with the cracked spine and the tide tables in the margins — had a line copied twice: "Light is a contract." Under it, in a shakier hand: "The city broke theirs first."

Footsteps on the pier. The customs coat again, and a second shadow that smelled of wet wool and mint. "We're taking an inventory of unlicensed sources," the coat said. "You'll come to the counting house at dawn."

Mara hooded the lantern. In the sudden dark, the harbor sounded larger. "I'll come," she said. "The lantern comes too. It doesn't like to be alone."

The mint-shadow laughed once, surprised. "Neither do debts."`

const lanternCh3 = `Dawn at the counting house was a gray that had given up. Clerks moved like they were afraid of waking the ledgers.

Mara set the lantern on the assay table. Unhooded, it made the ink look wet. An older woman with a seal-ring turned a page that was more erasure than writing.

"Your aunt kept this light after the ration," the woman said. "We allowed it because the east breakwater needed a marker in fog. Then the breakwater was rebuilt, and the marker became a rumor, and rumors are expensive."

"What does it cost?" Mara asked.

"An oath you cannot keep in daylight." The woman did not smile. "Walk the old stones tonight. If the lantern goes out, the city will forgive the inventory. If it does not, you will learn the name of the ship we uncounted, and you will not sleep well."

Mara lifted the lantern. The flame leaned, almost a nod. "I don't sleep well now."

Outside, the first ferry horn made the gulls argue. She walked toward the breakwater with oil she had not been given, and a contract she had not signed, burning quietly in her hand.`

const lettersCh1 = `Box 214 had been empty for eleven months, which was how Len knew the envelope did not belong to the night.

She worked the late sort at the railway post: canvas bins, steam, the particular loneliness of other people's handwriting. The letter was thick, unstamped, and addressed in a script she recognized because she had practiced it on receipts when the counter was slow. Her own. The name on the front was hers, too, which felt like a prank until she opened it.

"Do not put this back in 214. Take the 9:40 to Iver. The second car. Bring nothing that jingles."

Len looked at the clock. The 9:40 existed. Iver existed. Jingling, she realized, was her key ring, her faith in procedure, and the little bell over the staff door.

She left the bell. She kept the key. Some contracts you break halfway, to see if they were ever real.`

const lettersCh2 = `The second car smelled of oranges and wet coats. Len sat opposite a man who was not reading the newspaper in his hands. At Iver he stood, and so did she, and neither of them pretended it was coincidence.

"You're early," he said on the platform, as if she had been late for years.

"I'm on time for a letter I didn't write."

He almost smiled. "You will. That's the part that bothers people."

They walked past the station lamp into a street that had fewer windows than a street should. He handed her a second envelope, this one stamped, ordinary, cruel in its normalcy. Inside: a work roster for the night sort, dated three weeks from now, with her name already in the column for "did not arrive."

"So I don't go back," Len said.

"You go back," he said. "You just don't stay the person who empties 214. Someone has to keep forwarding the letters that were never meant to arrive. We were hoping it would be you. You have the handwriting for it."

The 10:15 back to the city was boarding. Len listened to it the way you listen to a door you have not decided to close.`

const saltCh1 = `The assay office sat above the chandlery, which meant everything Wren weighed came with the smell of rope and old rain.

Copper was easy. Salt was honest. Ships were the problem. The morning ledger listed the Marrow Gull as docked in slip four with a hold of ore. Slip four held a cat and a bucket. Wren walked down anyway, because ledgers that lie still expect to be believed, and belief is how fraud learns to stand upright.

Captain Vell found her counting empty water. "You're early for a ghost," he said.

"I'm on time for copper."

"Then you're late for the truth." He nodded at the fog, which was doing its best impression of a wall. "The Gull paid harbor tax. The Gull is on the board. The Gull is also, inconveniently, at the bottom of the channel since last winter. Someone is very fond of ships that cannot argue."`

const saltCh2 = `Low tide drew a map the city did not publish. Wren followed Vell along the exposed spine of the old breakwater, boots sucking at weed, the assay satchel knocking her hip like a second conscience.

They found the copper first: not ore, coins, green with patience, stamped with a mint that had closed before Wren was born. Then the ledger-stone — a slab someone had tried to hide under kelp, chiseled with dates and slip numbers and a column titled "never arrived".

"They're counting absences," Wren said. "Absences that still pay tax."

"Worse," Vell said. "They're selling the cargo of ships that only exist on paper, and the buyers keep coming back because the paper is excellent."

A bell on the point began to ring, though the point had not had a bell in years. Wren looked at the coins in her palm. Salt had crusted in the dates. Copper, she thought, remembers who held it. She closed her fist and started back toward the assay office, already rewriting the morning page in her head — this time with a column for the living, and a column for the counted dead.`
