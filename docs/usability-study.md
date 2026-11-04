# Moderated usability study: reading and authoring

Status: **protocol prepared; no participants tested yet**. Automated browser checks and developer inspection are not user research.

## Questions

Can a first-time reader find a story, start reading and save it? Can a first-time author create a story and recover saved chapter work? Which labels, navigation or feedback cause hesitation? Does either workflow become harder on a narrow screen or with keyboard navigation?

Recruit 3–5 consenting people who have not used Inkwell, including readers and at least one person interested in writing. This is a small formative study, not representative market research. Offer participants their normal device and input method; never describe a developer simulating disability as a disabled participant.

## Setup and consent

Use the local seeded demo with synthetic content and disposable accounts, not a production service. Explain the purpose, approximate 20-minute duration, voluntary participation, ability to stop and that the product—not the person—is being evaluated. Ask permission before recording; anonymous notes alone are sufficient. Use participant codes such as P01, not names or emails, in the results. Ask what they expect a reading platform to let them do before showing the app.

## Neutral tasks

1. Find a mystery story that interests you and open its first chapter.
2. Continue to another chapter, then return to the story's chapter list.
3. Use the supplied demo account to keep a story so you can find it later. Then find your saved stories.
4. Create a new story with a title and short description; add a chapter and save a few sentences.
5. Leave the editor and reopen your work. Show how you know the last change was saved.

Give the task goal, not the names of controls or a click sequence. Ask the participant to think aloud. Do not steer them toward a solution. If they ask for help, first ask what they expected; if you provide a hint, record it. Stop a task after three minutes or when the participant chooses to stop. Never record a timed-out task as an unaided success.

## Record

Use `usability-observations.csv`. For each task record device/viewport, completion (unaided / assisted / failed / stopped), elapsed seconds, number of hints, observed errors, an anonymized quote, and the participant's 1–7 ease rating. Note actual behavior separately from the facilitator's interpretation. Do not fill rows with invented participants or synthetic success rates.

## Synthesis and retest

Group observations into navigation, vocabulary, visual hierarchy, form feedback and recovery. Prioritize blockers, repeated confusion and accessibility barriers before preferences. For each change record the source observation codes, proposed explanation, implementation, and a retest. Compare only matching tasks and conditions. With this sample, describe counts and observations rather than population-wide improvement percentages.

## Interview/accountability outline

After personally completing the study, prepare a short story with: the user problem; your specific contribution; evidence that changed your design; the implementation tradeoff; how you tested it; what remains uncertain. Do not claim participants, feedback, presentations or collaboration that did not occur. For a presentation, use five slides: problem, baseline findings, changes, measured checks, next user test. Existing internship experience can supply separate collaboration examples, described in your own words.

## Remaining accessibility checks

Automated axe checks are partial coverage. Manually verify keyboard focus remains visible through every flow, error/status announcements with a real screen reader (NVDA/VoiceOver), text resizing, high-contrast settings and real 400% browser zoom. A 320 CSS-pixel viewport is a reflow check, not a complete accessibility certification. Include users with relevant access needs when possible and with consent.
