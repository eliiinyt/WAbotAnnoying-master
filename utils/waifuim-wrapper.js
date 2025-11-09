const TAGS = {
  sfw: ['waifu', 'maid', 'uniform', 'marin-kitagawa', 'mori-calliope', 'raiden-shogun', 'oppai', 'selfies', 'kamisato-ayaka'],
  nsfw: ['ass', 'hentai', 'milf', 'oral', 'paizuri', 'ecchi', 'ero']
};

async function getImage(tags, type = 'sfw') {
  const tagList = TAGS[type];
  if (!tagList) {
    throw new TypeError(`Tipo inválido: ${type}. Usa 'sfw' o 'nsfw'.`);
  }

  const errorMessage = `Usa uno de los siguientes:\n${tagList.map(tag => `> ${tag}`).join('\n')}`;

  for (const tag of tags) {
    if (!tagList.includes(tag)) {
      throw new TypeError(`Tag desconocido: ${tag}.\n${errorMessage}`);
    }
  }

  const images = await searchImages(tags);
  if (!images || images.length === 0) {
    console.warn(`API ERROR: No se han encontrado imágenes para los tags: \n${tags.map(tag => `> ${tag}\n`).join('')}`);
    return null;
  }

  return images[0];
}

async function searchImages(tags, additionalParams = {}) { //maybe sirva los parámetros adicionales para luego reutilizar esto en otra API
  if (!tags || !Array.isArray(tags)) {
    throw new TypeError('Fallo de tags: se necesita un array de tags para hacer la búsqueda');
  }

  const apiUrl = 'https://api.waifu.im/search';
  const params = {
    included_tags: tags, // como no funciones me pego un tiro
  };

  const queryParams = new URLSearchParams();

  for (const key in params) {
    if (Array.isArray(params[key])) {
      params[key].forEach(value => {
        queryParams.append(key, value);
      });
    } else {
      queryParams.set(key, params[key]);
    }
  }

  const requestUrl = `${apiUrl}?${queryParams.toString()}`;

  try {
    const response = await fetch(requestUrl);
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    return result.images;
  } catch (error) {
    console.error('An error occurred:', error.message);
    throw error;
  }
}

module.exports = {
  getSFWImage: (tags) => getImage(tags, 'sfw'),
  getNSFWImage: (tags) => getImage(tags, 'nsfw'),
};
