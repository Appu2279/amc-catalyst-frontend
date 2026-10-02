// Student results and testimonials — shown on the /testimonials page and in
// the homepage's testimonials section. Only real, consented content goes
// here. Photos live in public/images/testimonials/ (4:5 portraits, 640×800).

// Doctors from the community who cleared AMC-1, as announced on the
// "Congratulations" posters. Order follows the posters.
export const RESULTS = [
  { name: 'Dr. Suhaib Shabir', photo: '/images/testimonials/suhaib-shabir.jpg' },
  { name: 'Dr. Lakshmishree Shanti', photo: '/images/testimonials/lakshmishree-shanti.jpg' },
  { name: 'Dr. Pranay Khanna', photo: '/images/testimonials/pranay-khanna.jpg' },
  { name: 'Dr. Jai Vishnu Pandi Kannan', photo: '/images/testimonials/jai-vishnu-pandi-kannan.jpg' },
  { name: 'Dr. Sneha Antony', photo: '/images/testimonials/sneha-antony.jpg' },
  { name: 'Dr. Dhruv Goyal', photo: '/images/testimonials/dhruv-goyal.jpg' },
  { name: 'Dr. Sai Kiran Reddy', photo: '/images/testimonials/sai-kiran-reddy.jpg' },
  { name: 'Dr. Ali Haider', photo: '/images/testimonials/ali-haider.jpg' },
  { name: 'Dr. Shalini Sreenivasan', photo: '/images/testimonials/shalini-sreenivasan.jpg' },
  { name: 'Dr. Pooja', photo: '/images/testimonials/pooja.jpg' },
].map((r) => ({ ...r, result: 'AMC-1 Pass' }));

// Students' own words, from their messages (only spacing/typos tidied).
//   quote – the message
//   name  – as the student signed it; null when the message wasn't signed
//   role  – short credential line
//   photo – optional; initials or a generic avatar are shown without one
//   featured – shown as a large photo + quote story on /testimonials
//              (others go in the smaller "In their words" grid)
export const TESTIMONIALS = [
  {
    quote:
      'A big thank you to Dr Faisal and the entire AMC Catalyst team for the constant support throughout my AMC journey, from registration right up to exam day. The platform is thoughtfully designed, with well-structured notes aligned with Australian guidelines, making the preparation journey much more streamlined. Really happy and grateful to be a part of such a great community. Thank you for creating AMC Catalyst and for all the guidance and support!',
    name: 'Dr. Pooja',
    role: 'Cleared AMC-1',
    photo: '/images/testimonials/pooja.jpg',
    featured: true,
  },
  {
    quote:
      'A big thank you to AMC Catalyst and all the amazing doctors in this community for the guidance, support, and encouragement throughout my AMC journey. Dr. Solosailor, you’re doing an amazing job bringing doctors together and building such a supportive community. Happy to say that I’ve cleared my AMC exam! Truly grateful to be a part of this wonderful community.',
    name: 'Dr. Shalini Sreenivasan',
    role: 'Cleared AMC-1',
    photo: '/images/testimonials/shalini-sreenivasan.jpg',
    featured: true,
  },
  {
    quote:
      'I am a member of the AMC Catalyst community and I’m glad that I cleared my AMC 1 exam last month with a decent score. My preparation and the steps for applying for AMC 1 were done with the help of Dr. Solosailor throughout my journey. Thank you so much for guiding me, doctor.',
    name: 'Dr. Jai Vishnu Pandi Kannan',
    role: 'Cleared AMC-1',
    photo: '/images/testimonials/jai-vishnu-pandi-kannan.jpg',
    featured: true,
  },
];
