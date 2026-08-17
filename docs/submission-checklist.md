# SKOP submission checklist

## Repository

- [ ] Repository is public when opened in a signed-out browser.
- [ ] `tsungai@openwindow.co.za` is an accepted collaborator.
- [ ] All submission work is committed and pushed to `main`.
- [ ] `git status` is clean.
- [ ] README links and screenshots work on GitHub.

## Fresh clone

- [ ] Clone the public repository into a new folder.
- [ ] Run `npm install` without using files from the working copy.
- [ ] Run `npm run expo` and open the app in Expo Go.
- [ ] Run `npm run web` and open `http://localhost:8081`.
- [ ] Confirm no `.env` file or local Firebase file is required.

## Firebase

- [ ] Create a new test account.
- [ ] Receive and open the verification email.
- [ ] Complete onboarding and save the profile.
- [ ] Confirm the profile appears in Firestore.
- [ ] Log out and log back in.
- [ ] Confirm the saved profile returns.
- [ ] Complete a Breakout session and confirm it appears in insights.
- [ ] Save a spending check-in and confirm it syncs.
- [ ] Confirm one account cannot read another account's Firestore data.
- [ ] Confirm the repository's `firestore.rules` are published.

## Automated checks

- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npx tsc --noEmit`
- [ ] Expo web export
- [ ] Expo Android export

## Demonstration video

- [ ] Video is close to 10 minutes.
- [ ] First one to two minutes explain the three inspiration cards, SKOP, and the implementation approach.
- [ ] App is shown live and running.
- [ ] Technical terms are used while features are shown.
- [ ] Video is uploaded to Google Drive.
- [ ] Sharing is set to `Anyone with the link can view`.
- [ ] Link works in an incognito browser.
- [ ] Final link replaces the README placeholder.
