/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "cdn-icons-png.flaticon.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              connect-src
                'self'
                https://firestore.googleapis.com
                https://identitytoolkit.googleapis.com
                https://securetoken.googleapis.com
                https://firebasestorage.googleapis.com
                https://firebase.googleapis.com
                https://res.cloudinary.com
                https://api.cloudinary.com;
              img-src
                'self'
                https:
                blob:
                data:
                https://firebasestorage.googleapis.com
                https://res.cloudinary.com
                https://*.cloudinary.com;
              frame-src
                'self'
                https://*.firebaseapp.com
                https://accounts.google.com;
            `.replace(/\s{2,}/g, " "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
