// Company details. Values in [brackets] would render as placeholders.
export const site = {
  name: 'IDT',
  legalName: 'Integrated Dental Technologies',
  email: 'idt.digitalexpert@gmail.com',
  phone: '+20 112 132 1366',
  whatsapp: '+20 155 687 1996',
  address: 'Nasr City, Cairo, Egypt',
  hours: 'Sun–Thu, 09:00–17:00',
  // Social profiles: add more entries here (id must match an icon in js/components/social.js).
  socials: [
    { id: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/share/1HifsCnKEe/' },
  ],
};

export const isPlaceholder = (v) => /^\[.*\]$/.test(String(v));
