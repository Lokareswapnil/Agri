# 📱 Agri-Tally Mobile: Play Store Deployment & Testing Pack
**मराठी आणि English मार्गदर्शिका • Comprehensive setup and compilation kit**

We have successfully created a complete, offline-first React Native (Expo) version of your agricultural bookkeeping shop application inside this export pack! 

This pack is fully configured so you can compile it and upload it directly into the **Google Play Store**. Meanwhile, your core web application remains fully active in the live preview so your Twilio voice calling continues to run correctly here!

---

## 🚀 Part 1: How to Test the App Instantly on your Mobile (Testing)

You can run your app live on your own smartphone before publishing it to the Play Store.

1. **Download the ZIP**: 
   Click on the Settings menu (top right of the editor) and click **Export as ZIP** to download all code files.
2. **Install Node.js & dependencies**:
   On your computer, extract the downloaded folder. Open the Command Prompt or Terminal, navigate into `/react-native-export` and run:
   ```bash
   npm install
   ```
3. **Download Expo Go App**:
   - Install **Expo Go** from Google Play Store on your Android mobile.
4. **Launch Developer Server**:
   Run the following command on your computer's terminal:
   ```bash
   npx expo start
   ```
5. **Scan and Play**:
   A QR Code will appear in your computer's terminal. Scan this QR using the Expo Go mobile app (or your phone camera). Your application will immediately launch on your Android smartphone! Any changes you make will live-reload on your phone.

---

## 📦 Part 2: Generate APK / AAB for Google Play Store (Production)

To upload your application to the Google Play Console for publication:

### Step 1: Initialize EAS Account
Expo provides a free online cloud service to compile high-quality Android apps without requiring complex setups.
1. Create a free account at [expo.dev](https://expo.dev).
2. Install EAS CLI globally on your computer terminal:
   ```bash
   npm install -g eas-cli
   ```
3. Login using your Expo credentials:
   ```bash
   eas login
   ```

### Step 2: Initialize EAS Project configuration
Configure the deployment definitions for your app:
```bash
eas project:init
```

### Step 3: Configure Build profile (`eas.json`)
Run this command inside `/react-native-export` to create an `eas.json` file automatically:
```bash
eas build:configure
```

To configure it to produce a direct **`.apk`** file (which you can transfer to your friends and farmers for direct manual testing) alongside `.aab` (required by Play Store), replace the contents of `eas.json` with:
```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Step 4: Run EAS Build for Google Play Store
Execute the following to build your production package:
```bash
# To generate a standard installable APK on phone (for preview/sharing):
eas build --platform android --profile preview

# To generate the standard AAB bundle to upload into Play Store Console:
eas build --platform android --profile production
```

Once the cloud builder finishes, **Expo will provide a direct download link**. Download the APK/AAB, sign in to your Google Play Console, and release it to the public!

---

## 🇮🇳 मराठीत सोपे मार्गदर्शन (मराठी)

आम्ही तुमचे कृषी दुकान बिलिंग अ‍ॅप्लिकेशन पूर्णपणे **React Native** मध्ये रूपांतरीत केले आहे. आता तुम्ही हे अ‍ॅप थेट तुमच्या अँड्रॉइड मोबाईलवर चालवू शकता आणि **Google Play Store** वर अपलोड करू शकता.

### १. मोबाईलवर अ‍ॅप टेस्ट कसे करावे?
1. संपूर्ण प्रोजेक्टचा **ZIP** फाईल डाऊनलोड करा (वर कोपऱ्यातील Settings वर जाऊन Export ZIP करा).
2. तुमच्या कॉम्पुटरवर झिप फाईल उघडून `/react-native-export` फोल्डरमध्ये जा.
3. खालील कमांडर चालवा:
   ```bash
   npm install
   ```
4. तुमच्या मोबाईलवर Play Store वरून **Expo Go** नावाचे अ‍ॅप डाऊनलोड करा.
5. कॉम्पुटरवर चालू करण्यासाठी खालील कमांड टाका:
   ```bash
   npx expo start
   ```
6. टर्मिनलमध्ये येणारा **QR Code** तुमच्या मोबाईलच्या कॅमेराने स्कॅन करा, तुमचे कृषी अ‍ॅप थेट मोबाईलवर सुरु होईल!

### २. प्ले स्टोअर (Play Store) साठी APK फाईल कशी बनवायची?
1. [expo.dev](https://expo.dev) वर जाऊन मोफत अकाउंट बनवा.
2. तुमच्या कॉम्प्युटरमध्ये EAS CLI इन्स्टॉल करा: `npm install -g eas-cli`
3. साईन-इन करा: `eas login`
4. डायरेक्ट इंस्टॉल होणारी .apk फाईल बनवण्यासाठी खालील कमांड टाका:
   ```bash
   eas build --platform android --profile preview
   ```
   **Expo Cloud** काही मिनिटांत तुम्हाला फाईल बनवून देईल, ती तुम्ही थेट प्ले स्टोअरवर अपलोड करू शकता!
