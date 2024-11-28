// Crie uma variável "numero" e peça um valor com prompt verifique se é positivo, negativo ou zero. Use if-else para imprimir a respectiva mensagem.

let numero = Number(prompt('Digite um numero, positivo ou negativo.'));

if(numero > 0) {
    alert(`O ${numero} é positivo`);
} else if (numero < 0) {
    alert(`O ${numero} é negativo`);
} else {
    alert(`O ${numero} é neutro.`);
}
