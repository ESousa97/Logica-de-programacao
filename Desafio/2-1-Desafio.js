let dia = prompt("Qual dia é hoje?");

if (dia === "Sábado" || dia === "Domingo") {
    alert("Bom fim de semana!");
} else {
    alert("Boa semana!");
}

// 1. let dia = prompt("Qual dia é hoje?");

// Aqui, usamos a função prompt() para pedir ao usuário que insira o dia da semana. O prompt() abre uma janela de entrada no navegador, onde o usuário pode digitar algo.
// O valor digitado pelo usuário (por exemplo, "Segunda", "Sábado", etc.) é armazenado na variável dia.

// 2. if (dia === "Sábado" || dia === "Domingo")

// Esta linha usa uma estrutura de controle if para verificar se o valor de dia corresponde a "Sábado" ou "Domingo".
// === é o operador de comparação estrita, que verifica se dia é exatamente igual ao texto "Sábado" ou "Domingo" (considerando inclusive o uso de maiúsculas e minúsculas).
// || é o operador lógico "OU". Ele faz com que a condição seja verdadeira se pelo menos uma das comparações for verdadeira:
// Se dia for igual a "Sábado", a condição será verdadeira.
// Se dia for igual a "Domingo", a condição também será verdadeira.
// Se a condição for verdadeira (ou seja, o dia é "Sábado" ou "Domingo"), o código executa o bloco de código dentro das chaves {}.

// 3. alert("Bom fim de semana!");

// Se a condição for verdadeira, o código executa alert(), que exibe uma mensagem na tela dizendo "Bom fim de semana!".

// 4. else {
// Se a condição do if for falsa (ou seja, o dia não for "Sábado" nem "Domingo"), o código passa para o bloco else.

//5. alert("Boa semana!");

// O código dentro do else é executado, exibindo a mensagem "Boa semana!" se o dia não for "Sábado" ou "Domingo".

// Como funciona o código:
// O usuário é solicitado a digitar um dia da semana.
// O código verifica se o dia é "Sábado" ou "Domingo".
// Se for um dos dois, a mensagem "Bom fim de semana!" é exibida.
// Caso contrário, a mensagem "Boa semana!" é exibida.