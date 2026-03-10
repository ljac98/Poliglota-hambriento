import React from 'react';
import hatAle from '../imagenes/sombreros/sobreros ale.png';
import hatEsp from '../imagenes/sombreros/sobreros esp.png';
import hatFra from '../imagenes/sombreros/sobreros fra.png';
import hatIng from '../imagenes/sombreros/sobreros ing.png';
import hatIta from '../imagenes/sombreros/sobreros ita.png';
import hatPor from '../imagenes/sombreros/sombrero por.png';

const HAT_IMGS = {
  alemán:    hatAle,
  español:   hatEsp,
  francés:   hatFra,
  inglés:    hatIng,
  italiano:  hatIta,
  portugués: hatPor,
};

const HatSVG = ({ lang, size = 40 }) => {
  const src = HAT_IMGS[lang];
  if (!src) return null;
  return (
    <img
      src={src}
      alt={lang}
      style={{ width: size * 1.3, height: size, objectFit: 'contain', display: 'inline-block' }}
    />
  );
};

export default HatSVG;
