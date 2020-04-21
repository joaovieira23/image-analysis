'use strict';
const { promises: { readFile } } = require('fs')


class Handler {
  constructor({ rekoSvc, translatorSvc }) {
    this.rekoSvc = rekoSvc
    this.translatorSvc = translatorSvc
  }
  async detectImageLabels(buffer) {
    const result = await this.rekoSvc.detectLabels({
      Image: {
        Bytes: buffer
      }
    }).promise()

    const workingItems = result.Labels
      .filter(({ Confidence }) => Confidence > 80);

    const names = workingItems
      .map(({ Name }) => Name)
      .join(' and ')
    
    return { names, workingItems }
  }

  async translateText(text) {
    const params = {
      SourceLanguageCode: 'en',
      TargetLanguageCode: 'pt',
      Text: text
    }

    const result = await this.translatorSvc
      .translateText(params)
      .promise()
    
    console.log(JSON.stringify(result))
  }

  async main(event) {
    try {
      const imgBuffer = await readFile('./images/golden.jpg')
      console.log('Detecting labels...')
      const { names, workingItems } = await this.detectImageLabels(imgBuffer)
      
      console.log('Translating to Portuguese...')
      const texts = await this.translateText(names)

      console.log('handling final object...')
      return {
        statusCode: 200,
        body: 'Hello João Andrade!'
      }
    } catch (error) {
      console.log('Error**', error.stack)
      return {
        statusCode: 500,
        body: 'Internal server error!'
      }
    }
  }
}

// factory = cria todas minhas instâncias e passa as dependências para a classe
const aws = require('aws-sdk')
const reko = new aws.Rekognition()
const translator = new aws.Translate()

const handler = new Handler({
  rekoSvc : reko,
  translatorSvc: translator
})

module.exports.main = handler.main.bind(handler)