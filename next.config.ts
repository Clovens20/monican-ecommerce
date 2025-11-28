import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Désactiver les indicateurs de développement (menu en bas à gauche)
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  
  // Désactiver l'overlay de développement (si vous voulez aussi masquer les erreurs)
  // reactStrictMode: true,
};

export default nextConfig;
