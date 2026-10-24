export const prayers = {
  cross: 'Em nome do Pai, e do Filho, e do Espírito Santo. Amém.',
  creed: 'Creio em Deus Pai todo-poderoso, Criador do céu e da terra; e em Jesus Cristo, seu único Filho, nosso Senhor; que foi concebido pelo poder do Espírito Santo; nasceu da Virgem Maria; padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado; desceu à mansão dos mortos; ressuscitou ao terceiro dia; subiu aos céus; está sentado à direita de Deus Pai todo-poderoso, de onde há de vir a julgar os vivos e os mortos. Creio no Espírito Santo; na Santa Igreja Católica; na comunhão dos santos; na remissão dos pecados; na ressurreição da carne; na vida eterna. Amém.',
  father: 'Pai nosso, que estais nos céus, santificado seja o vosso nome; venha a nós o vosso reino; seja feita a vossa vontade, assim na terra como no céu. O pão nosso de cada dia nos dai hoje; perdoai-nos as nossas ofensas, assim como nós perdoamos a quem nos tem ofendido; e não nos deixeis cair em tentação, mas livrai-nos do mal. Amém.',
  mary: 'Ave Maria, cheia de graça, o Senhor é convosco. Bendita sois vós entre as mulheres, e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora de nossa morte. Amém.',
  glory: 'Glória ao Pai, e ao Filho, e ao Espírito Santo. Como era no princípio, agora e sempre. Amém.',
  fatima: 'Ó meu Jesus, perdoai-nos, livrai-nos do fogo do inferno, levai as almas todas para o céu e socorrei principalmente as que mais precisarem da vossa misericórdia.',
  queen: 'Salve, Rainha, Mãe de misericórdia, vida, doçura e esperança nossa, salve! A vós bradamos, os degredados filhos de Eva. A vós suspiramos, gemendo e chorando neste vale de lágrimas. Eia, pois, advogada nossa, esses vossos olhos misericordiosos a nós volvei; e, depois deste desterro, mostrai-nos Jesus, bendito fruto do vosso ventre. Ó clemente, ó piedosa, ó doce sempre Virgem Maria. Rogai por nós, santa Mãe de Deus, para que sejamos dignos das promessas de Cristo. Amém.',
};

export const rosaryGroups = [
  {id:'gozosos',title:'Mistérios gozosos',description:'A alegria da Encarnação e da infância de Jesus.',mysteries:[
    {title:'A Anunciação',reference:'Lc 1,26–38',meditation:'Contemple o anúncio recebido por Maria e sua resposta. Que espaço você dá à escuta antes de responder?'},
    {title:'A Visitação',reference:'Lc 1,39–56',meditation:'Maria visita Isabel. Pense na atenção ao próximo e em uma presença que leve esperança.'},
    {title:'O nascimento de Jesus',reference:'Lc 2,1–20',meditation:'Contemple o nascimento do Salvador. A simplicidade do presépio convida a reconhecer o essencial.'},
    {title:'A apresentação de Jesus no Templo',reference:'Lc 2,22–38',meditation:'José e Maria apresentam Jesus. Recorde a fidelidade a Deus nos gestos concretos da vida.'},
    {title:'O encontro de Jesus no Templo',reference:'Lc 2,41–52',meditation:'Contemple a busca e o encontro. Apresente a Deus aquilo que você ainda não compreende.'},
  ]},
  {id:'dolorosos',title:'Mistérios dolorosos',description:'A Paixão e a entrega de Cristo.',mysteries:[
    {title:'A agonia no Horto',reference:'Lc 22,39–46',meditation:'Jesus reza na angústia. Entregue a Deus suas dificuldades sem esconder sua fragilidade.'},
    {title:'A flagelação',reference:'Mt 27,26',meditation:'Contemple o sofrimento de Cristo. Peça um coração atento à dignidade de quem sofre.'},
    {title:'A coroação de espinhos',reference:'Mt 27,27–31',meditation:'Diante da humilhação de Jesus, examine o modo como usa palavras, força e autoridade.'},
    {title:'Jesus carrega a cruz',reference:'Lc 23,26–32',meditation:'Recorde o caminho do Calvário e a ajuda de Simão. A quem você pode ajudar a carregar um peso?'},
    {title:'A crucificação e morte de Jesus',reference:'Jo 19,25–30',meditation:'Permaneça alguns instantes diante da Cruz. Contemple o amor e a entrega, sem pressa de explicar tudo.'},
  ]},
  {id:'gloriosos',title:'Mistérios gloriosos',description:'Ressurreição, missão e esperança na glória.',mysteries:[
    {title:'A Ressurreição',reference:'Jo 20,1–18',meditation:'A manhã da Páscoa convida à esperança. Apresente a Cristo o que precisa ser renovado em sua vida.'},
    {title:'A Ascensão',reference:'At 1,6–11',meditation:'Os discípulos recebem uma missão. Que dever concreto o estudo da fé ajuda você a assumir?'},
    {title:'A vinda do Espírito Santo',reference:'At 2,1–13',meditation:'Reze pela coragem de testemunhar a fé com palavras e obras de caridade.'},
    {title:'A Assunção de Nossa Senhora',reference:'Catecismo, § 966; Ap 12,1 como imagem para meditação',meditation:'Contemple a esperança da vida plena com Deus. A Assunção não é narrada diretamente nos Evangelhos; a referência bíblica é uma aproximação contemplativa.'},
    {title:'A coroação de Nossa Senhora',reference:'Ap 12,1 como imagem contemplativa; Catecismo, § 966',meditation:'A realeza de Maria é contemplada em sua união com Cristo. Não leia a imagem como uma cronologia literal de uma cena dos Evangelhos.'},
  ]},
  {id:'luminosos',title:'Mistérios luminosos',description:'A vida pública de Jesus; série proposta em 2002.',mysteries:[
    {title:'O Batismo de Jesus no Jordão',reference:'Mt 3,13–17',meditation:'Contemple a manifestação de Jesus no Jordão e recorde o chamado a viver a graça do Batismo.'},
    {title:'As Bodas de Caná',reference:'Jo 2,1–11',meditation:'Maria dirige a atenção para Jesus. Que palavra de Cristo você precisa escutar com mais atenção?'},
    {title:'O anúncio do Reino e o convite à conversão',reference:'Mc 1,14–15',meditation:'Receba o convite à conversão como resposta concreta, e não apenas desejo abstrato.'},
    {title:'A Transfiguração',reference:'Mt 17,1–8',meditation:'Contemple a glória de Cristo e o chamado a escutá-lo também ao voltar às tarefas comuns.'},
    {title:'A instituição da Eucaristia',reference:'Lc 22,14–20',meditation:'Recorde a entrega de Jesus e reze para participar da vida eucarística com gratidão e reverência.'},
  ]},
] as const;
