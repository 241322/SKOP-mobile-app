# Minor access release checklist

This file tracks work that sits outside the React Native screens.

## Implemented in the app

- The welcome flow appears before account creation.
- The birth date has no default value and does not reveal a passing age.
- The full birth date stays in screen memory and is not saved.
- SKOP saves only `13_17` or `18_plus` for account holders.
- Under-13 users receive support and Breakout without an account.
- Users aged 13 to 17 see a guardian step before signup.
- Teen guidance points to a trusted adult, doctor or pharmacist.
- SKOP has no ads, social features, location collection or direct messaging.

## Required before store release

- Get the guardian consent process reviewed against POPIA sections 34 and 35.
- Add guardian identity or email verification if the review requires it.
- Publish a privacy policy covering Firebase Authentication, Firestore, nicotine plans,
  spending check-ins, session history, age bands and guardian consent.
- Add the privacy policy URL in Google Play Console and App Store Connect.
- Complete Google Play Data safety and Target audience declarations for ages 13-15,
  16-17 and 18+.
- Confirm every included SDK is allowed for a mixed child and adult audience.
- Complete Apple's privacy nutrition labels and age-rating questionnaire.
- Do not select Apple's Kids Category because SKOP is not aimed at children aged 11 or younger.
- Give both stores a review account and explain the three age routes in the review notes.
- Have the nicotine guidance reviewed by a healthcare professional.

## Guardian consent limitation

The current screen records a guardian statement and timestamp. It does not verify the
guardian's identity. Do not describe this as verified parental consent until a reviewed
verification method is in place.
