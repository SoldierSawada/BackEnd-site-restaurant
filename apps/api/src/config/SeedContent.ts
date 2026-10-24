import { Container } from 'inversify';
import { BlogArticle, BlogArticleInput, BookingIdentifiers, BlogArticleRepository, MenuItem, MenuItemInput, MenuItemRepository } from 'restaurant-core';

interface InitialArticle extends BlogArticleInput {
  publishedAt: string;
}

const initialArticles: InitialArticle[] = [
  {
    title: 'Une journée en cuisine, de 8 h à minuit',
    category: 'Coulisses',
    excerpt: "Avant le premier client, il y a le fond, le pain et les mises en place. Nous avons suivi l'équipe pendant une journée complète.",
    author: 'Léa Martin',
    publishedAt: '2026-10-12',
    content: [
      "À 8 heures, la cuisine est encore silencieuse. Le chef arrive le premier, vérifie les livraisons et goûte le fond de volaille de la veille.",
      "Vers 9 heures, la choucroute est mise à cuire doucement avec le riesling. Elle restera au chaud toute la journée, comme le veut la tradition alsacienne.",
      "À partir de 19 heures, les tickets arrivent sans interruption. Chacun sait exactement ce qu'il doit faire, et le passe garde le rythme.",
      "Après le dernier couvert, on nettoie, on prépare le lendemain et on éteint les feux vers minuit.",
    ].join('\n\n'),
  },
  {
    title: "La choucroute, un plat d'hiver qui se prépare à l'avance",
    category: 'Recettes',
    excerpt: 'Chou fermenté, vin blanc d\'Alsace et trois viandes : la recette de la maison, étape par étape.',
    author: 'Léa Martin',
    publishedAt: '2026-10-03',
    content: [
      "La choucroute demande de la patience. Le chou est fermenté avec du sel, puis cuit longuement avec du riesling et des baies de genièvre.",
      "Nous la garnissons de trois viandes : du jambonneau, de la saucisse de Strasbourg et du lard fumé. Les pommes de terre sont cuites à part, à la vapeur.",
    ].join('\n\n'),
  },
  {
    title: "Accords mets et vins d'Alsace : nos conseils",
    category: 'Accords',
    excerpt: "Riesling, gewurztraminer, pinot noir ou crémant : quel vin pour quel plat alsacien ?",
    author: 'Léa Martin',
    publishedAt: '2026-09-27',
    content: [
      "Un bon accord repose sur un principe simple : des saveurs qui se répondent, sans se masquer.",
      "Avec la choucroute, nous conseillons un riesling sec et vif. Avec le munster, un gewurztraminer aromatique fait merveille. Le crémant d'Alsace accompagne joliment les entrées.",
    ].join('\n\n'),
  },
  {
    title: 'Pourquoi nous cuisinons le pain sur place',
    category: 'Maison',
    excerpt: 'Levain, farine d\'épeautre cultivée en Alsace et cuisson du matin : le pain est le premier plat de la journée.',
    author: 'Léa Martin',
    publishedAt: '2026-09-19',
    content: [
      "Le levain est nourri chaque matin. Il donne au pain son goût légèrement acidulé et une mie qui se conserve bien.",
      "Nous travaillons une part de farine d'épeautre, une céréale traditionnelle de la région. Cuire sur place nous permet de servir un pain tiède à midi.",
    ].join('\n\n'),
  },
  {
    title: "Le marché du mardi : nos producteurs alsaciens",
    category: 'Producteurs',
    excerpt: "Asperges de Benfeld, choux de Schiltigheim, fromages des Vosges : nos fournisseurs de la région.",
    author: 'Léa Martin',
    publishedAt: '2026-09-12',
    content: [
      "Chaque mardi, nous passons au marché avant l'ouverture. Nous choisissons les légumes à la main, sans intermédiaire.",
      "Au printemps, les asperges de la plaine d'Alsace font leur apparition à la carte. Les maraîchers nous annoncent aussi ce qui arrive dans la semaine.",
    ].join('\n\n'),
  },
  {
    title: 'Le kougelhopf, la brioche alsacienne',
    category: 'Recettes',
    excerpt: 'Raisins secs, amandes et une cuisson dans un moule cannelé : la recette traditionnelle de nos desserts.',
    author: 'Léa Martin',
    publishedAt: '2026-08-29',
    content: [
      "Le kougelhopf se prépare la veille. La pâte lève lentement, puis elle est versée dans un moule cannelé avec des raisins secs et des amandes.",
      "Servi au petit-déjeuner ou avec le café de l'après-midi, il reste la brioche emblématique de l'Alsace.",
    ].join('\n\n'),
  },
];

const initialMenuItems: MenuItemInput[] = [
  { title: "Jus de pomme d'Alsace", category: 'boissons', price: 4.5, description: "Pressé en Alsace, **sans sucre ajouté**, servi bien frais." },
  { title: 'Limonade à la quetsche', category: 'boissons', price: 4.5, description: "Limonade préparée chaque jour avec des **quetsches** de la région.\n\n- Citron frais\n- Quetsches\n- Menthe" },
  { title: 'Bière artisanale d\'Alsace', category: 'boissons', price: 5.5, description: "Une bière blonde brassée en Alsace, servie **fraîche** en pression." },
  { title: 'Eslass cola', category: 'boissons', price: 3.5, description: "Cola servi bien frais, avec ou sans glaçons." },
  { title: 'Limonade Liness', category: 'boissons', price: 4, description: "Limonade pétillante **Liness**, servie bien fraîche." },
  { title: 'Eau de Carola', category: 'boissons', price: 3, description: "Eau minérale **plate**, bouteille de 50 cl." },
  { title: 'Eau de Lisbeth', category: 'boissons', price: 3.5, description: "Eau minérale **gazeuse**, bouteille de 50 cl." },
  { title: 'Orange gazeuse', category: 'boissons', price: 3.5, description: "Boisson à l'orange pétillante, servie bien fraîche." },
  { title: 'Ice tea pêche', category: 'boissons', price: 3.5, description: "Thé glacé à la **pêche**, servi avec des glaçons." },
  { title: "Jus d'orange pressé", category: 'boissons', price: 4.5, description: "Oranges **pressées** au moment de la commande." },
  { title: 'Café', category: 'boissons', price: 2.5, description: "Expresso **servi au comptoir ou en salle**." },
  { title: 'Thé', category: 'boissons', price: 3, description: "Thé noir ou thé vert, servi en **théière** pour deux." },
  { title: 'Riesling d\'Alsace', category: 'vins', price: 6.5, description: "Vin blanc **sec et vif**, idéal avec la choucroute.\n\n| Région | Couleur | Service |\n| --- | --- | --- |\n| Alsace | Blanc | Au verre |" },
  { title: 'Gewurztraminer', category: 'vins', price: 7, description: "Vin blanc **aromatique**, notes de litchi et de rose.\n\n| Région | Couleur | Service |\n| --- | --- | --- |\n| Alsace | Blanc | Au verre |" },
  { title: 'Pinot noir d\'Alsace', category: 'vins', price: 6.5, description: "Vin rouge **léger et souple**, servi légèrement frais.\n\n| Région | Couleur | Service |\n| --- | --- | --- |\n| Alsace | Rouge | Au verre |" },
  { title: "Crémant d'Alsace", category: 'vins', price: 7.5, description: "Vin effervescent **élégant**, servi en coupe pour commencer le repas." },
  { title: '"Flammekueche" tarte flambée classique', category: 'entrees', price: 9, description: "Tarte fine à la **crème fraîche**, aux oignons et aux lardons, cuite au feu de bois.\n\n1. Pâte très fine\n2. Crème fraîche\n3. Oignons et lardons" },
  { title: '"Flammekueche" tarte flambée au munster', category: 'entrees', price: 11, description: "Tarte fine à la **crème fraîche**, au **munster fermier**, aux oignons et au cumin, cuite au feu de bois." },
  { title: '"Flammekueche" tarte flambée aux champignons', category: 'entrees', price: 10, description: "Tarte fine à la **crème fraîche**, aux champignons de saison, aux oignons et au persil, cuite au feu de bois." },
  { title: '"Flammekueche" tarte flambée au chèvre et au miel', category: 'entrees', price: 10.5, description: "Tarte fine au **fromage de chèvre frais**, au **miel** d'Alsace et aux noix, cuite au feu de bois." },
  { title: '"Flammekueche" tarte flambée sucrée aux pommes', category: 'desserts', price: 8, description: "Tarte fine à la **crème fraîche sucrée**, aux pommes et à la cannelle, cuite au feu de bois." },
  { title: '"Zwiwwelsupp" soupe à l\'oignon au munster', category: 'entrees', price: 8.5, description: "Soupe traditionnelle, **gratinée au munster**.\n\n- Oignons confits longuement\n- Croûtons toastés" },
  { title: 'Salade de chou à l\'alsacienne', category: 'entrees', price: 7, description: "Chou blanc râpé, vinaigrette à la moutarde et **lardons croustillants**." },
  { title: 'Foie gras maison', category: 'entrees', price: 16, description: "Foie gras de canard **cuit au torchon**, servi avec du pain d'épices et des fruits de saison." },
  { title: '"Sürkrüt" choucroute garnie', category: 'plats', price: 19, description: "Choucroute cuite au **riesling**, garnie de trois viandes et de pommes de terre vapeur.\n\n> Le plat emblématique de la maison." },
  { title: '"Bäckeoffe" ragoût des vignerons', category: 'plats', price: 18.5, description: "Viandes marinées dans le **vin blanc**, pommes de terre et oignons, cuits longuement dans un plat en terre.\n\n> Un plat familial de la région." },
  { title: 'Coq au riesling', category: 'plats', price: 19.5, description: "Coq fermier mijoté dans le **riesling**, avec des lardons et des champignons.\n\n| Cuisson | Temps |\n| --- | --- |\n| Mijoté | 1 h 30 |" },
  { title: 'Filet de sandre au beurre blanc', category: 'plats', price: 18, description: "Poisson de **rivière** de la région, légumes du marché et beurre blanc.\n\nLa carte change selon l'arrivage." },
  { title: 'Bœuf bourguignon', category: 'plats', price: 18, description: "Bœuf mijoté au **vin rouge**, avec des oignons grelots et des champignons.\n\n> Une recette classique de la cuisine française." },
  { title: 'Steak frites', category: 'plats', price: 16, description: "Steak de **bœuf** grillé, servi avec des frites maison.\n\n> Cuisson au choix : saignant, à point ou bien cuit." },
  { title: '"Kugelhopf" kougelhopf maison', category: 'desserts', price: 6, description: "Brioche aux **raisins secs** et aux amandes, à partager au café." },
  { title: 'Tarte aux myrtilles des Vosges', category: 'desserts', price: 7, description: "Myrtilles des Vosges sur une **pâte sablée** maison." },
  { title: 'Tarte au fromage blanc', category: 'desserts', price: 6.5, description: "Fromage blanc fermier, crème et **pâte brisée** maison." },
  { title: 'Crème brûlée', category: 'desserts', price: 7, description: "Crème à la **vanille de Madagascar**, caramel croustillant au moment du service." },
];

export async function seedContent(container: Container): Promise<void> {
  const articleRepository = container.get<BlogArticleRepository>(BookingIdentifiers.blogArticleRepository);
  const menuItemRepository = container.get<MenuItemRepository>(BookingIdentifiers.menuItemRepository);

  if ((await articleRepository.findAll()).length === 0) {
    for (const { publishedAt, ...input } of initialArticles) {
      await articleRepository.save(BlogArticle.create(input, new Date(`${publishedAt}T12:00:00Z`)));
    }
  }

  if ((await menuItemRepository.findAll()).length === 0) {
    for (const input of initialMenuItems) {
      await menuItemRepository.save(MenuItem.create(input));
    }
  }
}
