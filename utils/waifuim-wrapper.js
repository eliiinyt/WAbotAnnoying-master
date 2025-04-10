const TAGS = {
    sfw: ['waifu', 'maid', 'uniform', 'marin-kitagawa', 'mori-calliope', 'raiden-shogun', 'oppai', 'selfies', 'kamisato-ayaka'],
    nsfw: ['ass', 'hentai', 'milf', 'oral', 'paizuri', 'ecchi', 'ero']
  };
  
  async function getImage(tag, type = 'sfw') {
    const tagList = TAGS[type];
    if (!tagList) {
      throw new TypeError(`Tipo inválido: ${type}. Usa 'sfw' o 'nsfw'.`);
    }
  
    if (!tagList.includes(tag)) {
      throw new TypeError(`Tag desconocido: ${tag}. Usa uno de los siguientes: ${tagList.join(', ')}`);
    }
  
    const images = await searchImages(tag);
    if (!images || images.length === 0) {
      console.warn(`API ERROR: No se han encontrado imágenes para el tag: ${tag}`);
      return null;
    }
  
    return images[0];
  }
  
  async function searchImages(tag) {
    if (!tag || typeof tag !== 'string') {
      throw new TypeError(`Fallo de tag: se necesita un tag como cadena para hacer la búsqueda`);
    }
  
    const url = `https://api.waifu.im/search?included_tags=${encodeURIComponent(tag)}`;
  
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
  
    const result = await response.json();
    return result.images;
  }
  
  module.exports = {
    getSFWImage: (tag) => getImage(tag, 'sfw'),
    getNSFWImage: (tag) => getImage(tag, 'nsfw'),
  };
  