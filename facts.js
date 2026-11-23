/*
  Sutakem facts: the single place for real, checkable proof.
  Leave a field as null or [] until the client confirms it. Empty fields are
  simply not shown, so nothing on the site is ever invented or "lorem ipsum".
*/
window.SUTAKEM_FACTS = {
  yearsInBusiness: null,   // e.g. 6
  sitesInstalled: null,    // e.g. 120   (homes + businesses + schools)
  camerasInstalled: null,  // e.g. 1400
  responseTime: null,      // e.g. "Same day in Nairobi & Kiambu"

  clients: [],             // e.g. ["St. Mary's Girls, Thika", "Kahawa Supermarket"]  (only with permission)
  testimonials: [],        // e.g. { quote: "…", name: "Jane W.", role: "Bursar, St. Mary's Girls" }
  brands: [],              // e.g. ["Dahua", "Hikvision", "ZKTeco"]

  warranty: null,          // e.g. "1-year equipment warranty · 6 months on workmanship"
  compliance: [],          // e.g. ["KRA Tax Compliance Certificate", "NCA registered", "Dahua authorised installer"]  (only what he can show on request)

  // 24/7 support: the client's review says keep it ONLY if Sutakem genuinely answers round the clock.
  // true = show "24/7 technical support" · false = show the free site assessment instead.
  support247: true,         // confirmed by Brian for Sutakem, 2026-11-23

  location: null,          // e.g. "Ruiru, Kiambu County"
  hours: null              // e.g. "Mon–Sat 8am–6pm · emergencies 24/7"
};
