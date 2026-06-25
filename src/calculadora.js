function dividir(a, b) {
  return a / b;
}

function calcularMedia(numeros) {
  let soma = 0;
  for (let i = 0; i < numeros.length; i++) {
    soma += numeros[i];
  }
  return soma / numeros.length;
}

module.exports = { dividir, calcularMedia };