// for faster load time, include the rgb as an emoji property
function getBackground (imgPath) {
  let img = document.createElement("img")
  img.src = imgPath
  img.style.display = 'none'
  document.body.appendChild(img)
  return new Promise((res, rej) => {
    img.onload = (() => {
      let canvas = document.createElement('canvas')
      let context = canvas.getContext && canvas.getContext('2d')
      let rgb = { r: 0, g:0, b:0 }
      let blockSize = 8
      let data
      let i = -4
      if (!context) {
        return rgb
      }
      let height = canvas.height = img.height || img.naturalHeight || img.offSetHeight
      let width = canvas.width = img.width || img.naturalWidth || img.offSetWidth
      let count = 0
      context.drawImage(img, 0, 0)
      try {
        data = context.getImageData(0, 0, width, height)
      } catch (e) {
        return rgb
      }
      let length = data.data.length
      while ( (i += blockSize * 4) < length ) {
        if (data.data[i] === 0 || data.data[i+1] === 0 || data[i+2] ===0) continue
        ++count
        rgb.r += data.data[i]
        rgb.g += data.data[i+1]
        rgb.b += data.data[i+2]
      }
      rgb.r = ~~(rgb.r/count)
      rgb.g = ~~(rgb.g/count)
      rgb.b = ~~(rgb.b/count)
      res(rgb)
    })
  })
}

module.exports = {
  getBackground
}
