import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: { home: 'Home', products: 'Products', about: 'About', certifications: 'Certifications', faq: 'FAQ', contact: 'Contact', blog: 'Blog', login: 'Login', account: 'My Account' },
      hero: { tagline: 'Revive Your Natural Vitality' },
      cta: { buy_now: 'Buy Now', add_to_cart: 'Add to Cart', view_details: 'View Details', view_cart: 'View Cart', checkout: 'Checkout', continue_shopping: 'Continue Shopping', send_otp: 'Send OTP', verify_otp: 'Verify OTP', login: 'Login', logout: 'Logout', signup: 'Sign Up', save: 'Save', cancel: 'Cancel', apply: 'Apply', remove: 'Remove', submit: 'Submit' },
      cart: { empty: 'Your cart is empty', total: 'Total', subtotal: 'Subtotal', shipping: 'Shipping', free: 'Free', discount: 'Discount', items: 'items' },
      checkout: { title: 'Checkout', personal_details: 'Personal Details', delivery_address: 'Delivery Address', order_summary: 'Order Summary', full_name: 'Full Name', email: 'Email', phone: 'Phone', secured_by: 'Secured by Razorpay. Discreet billing.' },
      footer: { rights: 'All rights reserved.', tagline: "India's trusted men's Ayurvedic wellness brand" },
      blog: { title: 'Wellness Journal', tagline: 'Ayurvedic wisdom for modern men', read_more: 'Read More', related: 'Related Articles', no_posts: 'No articles yet — check back soon.' },
      reviews: { title: 'Customer Reviews', write: 'Write a Review', your_name: 'Your Name', rating: 'Your Rating', review_title: 'Review Title (optional)', review_comment: 'Share your experience', verified_purchase: 'Verified Purchase', moderation_note: 'Reviews appear after admin approval.', no_reviews: 'No reviews yet — be the first to share!' },
    },
  },
  hi: {
    translation: {
      nav: { home: 'होम', products: 'उत्पाद', about: 'हमारे बारे में', certifications: 'प्रमाणपत्र', faq: 'प्रश्नोत्तर', contact: 'संपर्क', blog: 'ब्लॉग', login: 'लॉगिन', account: 'मेरा खाता' },
      hero: { tagline: 'अपनी प्राकृतिक शक्ति को पुनर्जीवित करें' },
      cta: { buy_now: 'अभी खरीदें', add_to_cart: 'कार्ट में जोड़ें', view_details: 'विवरण देखें', view_cart: 'कार्ट देखें', checkout: 'चेकआउट', continue_shopping: 'खरीदारी जारी रखें', send_otp: 'OTP भेजें', verify_otp: 'OTP सत्यापित करें', login: 'लॉगिन', logout: 'लॉगआउट', signup: 'साइन अप', save: 'सहेजें', cancel: 'रद्द करें', apply: 'लागू करें', remove: 'हटाएं', submit: 'जमा करें' },
      cart: { empty: 'आपका कार्ट खाली है', total: 'कुल', subtotal: 'उप-योग', shipping: 'शिपिंग', free: 'मुफ़्त', discount: 'छूट', items: 'वस्तुएँ' },
      checkout: { title: 'चेकआउट', personal_details: 'व्यक्तिगत विवरण', delivery_address: 'डिलीवरी पता', order_summary: 'ऑर्डर सारांश', full_name: 'पूरा नाम', email: 'ईमेल', phone: 'फ़ोन', secured_by: 'Razorpay द्वारा सुरक्षित। गोपनीय बिलिंग।' },
      footer: { rights: 'सर्वाधिकार सुरक्षित।', tagline: 'भारत का भरोसेमंद आयुर्वेदिक पुरुष-स्वास्थ्य ब्रांड' },
      blog: { title: 'वेलनेस जर्नल', tagline: 'आधुनिक पुरुषों के लिए आयुर्वेदिक ज्ञान', read_more: 'और पढ़ें', related: 'संबंधित लेख', no_posts: 'अभी कोई लेख नहीं — जल्द आ रहा है।' },
      reviews: { title: 'ग्राहक समीक्षाएं', write: 'समीक्षा लिखें', your_name: 'आपका नाम', rating: 'आपकी रेटिंग', review_title: 'समीक्षा शीर्षक (वैकल्पिक)', review_comment: 'अपना अनुभव साझा करें', verified_purchase: 'सत्यापित खरीदारी', moderation_note: 'समीक्षाएं एडमिन अनुमोदन के बाद दिखेंगी।', no_reviews: 'अभी कोई समीक्षा नहीं — पहले बनें!' },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi'],
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'], lookupLocalStorage: 'ja_lang' },
    interpolation: { escapeValue: false },
  });

export default i18n;
