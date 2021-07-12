type JWT = {
  header: {
    alg: string
    typ: string
    kid: string
  }
  payload: {
    iss: string
    sub: string
    aud: string
    exp: number
  }
  signature: string
}
