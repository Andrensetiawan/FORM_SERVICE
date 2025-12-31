/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.cloudinary.com" },
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
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel.live;
              style-src 'self' 'unsafe-inline';
              connect-src 'self' data: https://vercel.live https://*.vercel.live https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebasestorage.googleapis.com https://firebase.googleapis.com https://res.cloudinary.com https://api.cloudinary.com https://*.cloudinary.com;
              img-src 'self' data: blob: https: https://firebasestorage.googleapis.com https://res.cloudinary.com https://*.cloudinary.com https://cdn-icons-png.flaticon.com https://images.unsplash.com;
              media-src 'self' blob: data: https://res.cloudinary.com https://*.cloudinary.com;
              frame-src 'self' https://*.firebaseapp.com https://accounts.google.com;
            `.replace(/\s+/g, " "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
