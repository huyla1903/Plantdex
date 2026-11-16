/*
@title        Plantdex - data
@version      0.3.0
@author       La Gia Huy
@since        2026-11-16
@updated      2026-11-16
@engine       JavaScript (ES5, browser)
@target       Plantdex web app (index.html)
@about        Every LEGO Botanicals planter-buddy set and its two figures. Edit this file by
              hand; there is no scraper. Order of sets = release order.

              Set fields
                sku, name, altName      LEGO item number, US name, other-region name
                tagline                 LEGO's one-line pitch from the product page
                released                ISO date (YYYY-MM-DD); a future date shows "Upcoming"
                pieces, ages, prices    piece count, LEGO age mark, retail prices at launch
                color                   accent colour of the set card
                lego, instructions      LEGO product page, building-instructions page
                review                  Jay's Brick Blog review
                gallery                 LEGO product images, hotlinked (never downloaded), in
                                        the product page's order. Either a URL string or
                                        { src, caption, fig }. fig = figure id when the image
                                        shows only that figure; its page lists those first.
                                        Copy the URL from the product page gallery
                                        (https://www.lego.com/cdn/cs/set/assets/...), without
                                        the ?query: the app adds the size it needs.
              Figure fields
                id                      stable id used in links (#/figure/<id>); never change
                name                    official name, or null if LEGO hasn't named it
                nickname                what fans call it while name is null
                plant, latin, pot       plant common name, botanical name, pot colour name
                color                   pot colour (tile background + drawn placeholder)
                card                    tile picture: { src, zoom, x, y } zooms into one figure
                                        of a group photo (zoom 1 = whole image; x, y = focus
                                        point in %). Without it the tile uses the first image
                                        tagged with fig, else a drawn pot.
                size                    { h, w } in cm, from LEGO's product page; null if LEGO
                                        doesn't give it
                pose, feature, extras   short facts shown on the figure page
                greeting, story         the text from the figure's instruction booklet: the
                                        headline and the body. Blank line in story = new
                                        paragraph. "" = not added yet.
*/
var LEGO_CDN = "https://www.lego.com/cdn/cs/set/assets/";

window.PLANTDEX = {
  title: "Plantdex",
  // Date the data was last checked against LEGO.com (shown in Settings).
  checked: "2026-11-16",
  // Shown as a card after the last set. Set to "" to hide it.
  comingNote: "Two more sets are due in 2027.",
  sets: [
    {
      sku: "10349",
      name: "Happy Plants",
      tagline: "Let joy bloom with 2 cheerful LEGO® plants",
      released: "2025-06-01",
      pieces: 217,
      ages: "9+",
      prices: ["US$22.99", "€19.99", "£17.99", "AU$29.99", "CA$24.99"],
      color: "#f2c94c",
      lego: "https://www.lego.com/en-us/product/happy-plants-10349",
      instructions: "https://www.lego.com/en-us/service/building-instructions/10349",
      review: "https://jaysbrickblog.com/reviews/review-lego-10349-happy-plants/",
      about: "The first pair of planter buddies and the cheapest Botanicals set at launch. Two instruction booklets, one per figure, so two people can build together. Their arms are posable and the two can hold hands.",
      gallery: [
        LEGO_CDN + "blt6921020c0cfcc903/10349_Prod_en-gb.png",
        { src: LEGO_CDN + "blt5192b33554e3d8b9/10349_boxprod_v39_en-gb.png", caption: "With the box" },
        LEGO_CDN + "blt881140fb86966803/10349_Lifestyle_envr_en-gb.jpg",
        LEGO_CDN + "blt2cde38ca8ce3b1d0/10349_WEB_SEC01_NOBG_en-gb.png",
        { src: LEGO_CDN + "blt74d1afe816256023/10349_WEB_SEC03_NOBG_en-gb.png", caption: "The plants swap between pots", fig: "blue" },
        LEGO_CDN + "blt3e6cdc4d30c36c89/10349_WEB_SEC02_NOBG_en-gb.png",
        LEGO_CDN + "blt7658940aa326fd20/10349_Lifestyle_cons_en-gb.jpg",
        LEGO_CDN + "blt29977d8bc081f2b0/10349_Lifestyle_cons_2_en-gb.jpg",
        { src: LEGO_CDN + "blte05175e1ed9af0a5/10349_Box5_v39_en-gb.png", caption: "Box back" }
      ],
      figures: [
        {
          id: "yellow",
          name: null,
          nickname: "Yellow",
          plant: "Dracaena (dragon tree)",
          latin: "Dracaena",
          pot: "Yellow",
          color: "#f2c94c",
          card: { src: LEGO_CDN + "blt6921020c0cfcc903/10349_Prod_en-gb.png", zoom: 1.6, x: 100, y: 60 },
          size: { h: 12, w: 8 },
          pose: "Standing on round 2×2 legs",
          feature: "Posable arms; holds hands with Blue",
          extras: "",
          greeting: "Dracaena",
          story: "The Dracaena is also known as the Dragon Tree. Unlike actual dragons, it does not spew fire. It simply creates a fierce vibe. This LEGO® version enjoys exploring new spaces and is guaranteed to feel at home with you. (Especially if you let it hold hands with your Friendship Plant.)"
        },
        {
          id: "blue",
          name: null,
          nickname: "Blue",
          plant: "Pilea (friendship plant)",
          latin: "Pilea",
          pot: "Light blue",
          color: "#8ec5e8",
          card: { src: LEGO_CDN + "blt6921020c0cfcc903/10349_Prod_en-gb.png", zoom: 1.6, x: 0, y: 75 },
          size: { h: 7, w: 9 },
          pose: "Sitting, feet built into the face plate",
          feature: "Posable arms; holds hands with Yellow",
          extras: "",
          greeting: "Pilea",
          story: "The Pilea is often called the Friendship Plant because it can be split apart and shared as a gift. It’s also a symbol of harmony. This young LEGO® offset is very easy to nurture. Just give it a little creative care and space, and it will make a cute, cozy companion."
        }
      ]
    },
    {
      sku: "11506",
      name: "Rocking Plants",
      tagline: "Let joy bloom with 2 rocking LEGO® plants in pastel pots",
      released: "2026-05-01",
      pieces: 253,
      ages: "9+",
      prices: ["US$22.99", "€19.99", "£17.99", "AU$29.99", "CA$29.99"],
      color: "#f4a6b8",
      lego: "https://www.lego.com/en-us/product/rocking-plants-11506",
      instructions: "https://www.lego.com/en-us/service/building-instructions/11506",
      review: "https://jaysbrickblog.com/reviews/review-lego-11506-rocking-plants/",
      about: "The first pair with official names. Rounded pieces underneath let both figures rock. The plants slot out and swap between all the pots, including the Happy Plants.",
      gallery: [
        LEGO_CDN + "bltf94cb9a8908c9cc9/blte47c9a08c6295596-11506_Prod.png",
        { src: LEGO_CDN + "bltd61f3311c95828a8/blte47c9a08c6295596-11506_boxprod_v39_en-us.png", caption: "With the box" },
        LEGO_CDN + "blt50fceef4b34b7feb/blte47c9a08c6295596-11506_WEB_PRI_NOBG.png",
        LEGO_CDN + "blte381e000ca46f9b5/blte47c9a08c6295596-11506_WEB_SEC01_NOBG.png",
        LEGO_CDN + "bltd85964ec19a0e41b/blte47c9a08c6295596-11506_WEB_SEC02_NOBG.png",
        { src: LEGO_CDN + "blt033c38c964c1d47c/blte47c9a08c6295596-11506_WEB_SEC03_NOBG.png", caption: "The plants swap between pots", fig: "lumi" },
        { src: LEGO_CDN + "blt60b912a892640361/blte47c9a08c6295596-11506_WEB_SEC04_NOBG.png", caption: "Ellie is 14 cm (5.5 in.) tall", fig: "ellie" },
        LEGO_CDN + "blt8d583eb6198cd8ae/blte47c9a08c6295596-11506_Lifestyle_cons.jpg",
        LEGO_CDN + "blt487af09da67d8834/blte47c9a08c6295596-11506_Lifestyle_cons_2.jpg",
        LEGO_CDN + "bltda36846110fc37dc/blte47c9a08c6295596-11506_Lifestyle_build.jpg",
        LEGO_CDN + "blt22c2f9221d6aac2b/blte47c9a08c6295596-11506_Lifestyle_envr.jpg",
        { src: LEGO_CDN + "blt46e47a9b254c82d4/blte47c9a08c6295596-11506_Box5_v39_en-us.png", caption: "Box back" }
      ],
      figures: [
        {
          id: "ellie",
          name: "Ellie",
          plant: "Mexican snowball (echeveria)",
          latin: "Echeveria elegans",
          pot: "Pink",
          color: "#f4a6b8",
          card: { src: LEGO_CDN + "blt60b912a892640361/blte47c9a08c6295596-11506_WEB_SEC04_NOBG.png", zoom: 2.4, x: 46, y: 72 },
          size: { h: 14, w: 8 },
          pose: "Legs out to the sides, doing the splits",
          feature: "Sways side to side; tall flower stem",
          extras: "",
          greeting: "Hi, my name is Ellie. I’m an Echeveria elegans!",
          story: "Born in Central America, this classic succulent is loved for its no-fuss attitude. It’s poised, adaptable, and if “elegant” comes to mind, we don’t blame you – it’s in the name! However, it’s not without its wild side. This LEGO® version and its vibrant, splashy flowers is the perfect reminder that life is full of surprises."
        },
        {
          id: "lumi",
          name: "Lumi",
          plant: "Ice plant",
          latin: "Delosperma cooperi",
          pot: "Lime green",
          color: "#c9dc8a",
          card: { src: LEGO_CDN + "bltf94cb9a8908c9cc9/blte47c9a08c6295596-11506_Prod.png", zoom: 1.6, x: 0, y: 85 },
          size: { h: 7, w: 9 },
          pose: "Sitting",
          feature: "Rocks back and forth; magenta flowers",
          extras: "",
          greeting: "Hi, my name is Lumi. I’m a Delosperma cooperi, also known as Ice Plant!",
          story: "However, this cool, sparkly succulent is anything but icy! The name comes from tiny hairs on its stem and leaves that reflect light and look just like ice crystals. Cool, right? All the way from South Africa, this adventurous, warm and fun-loving LEGO® plant is ready to play anywhere!"
        }
      ]
    },
    {
      sku: "10371",
      name: "Cozy Plants",
      altName: "Cosy Plants",
      tagline: "Add to your cozy decor collection with cute LEGO® plants",
      released: "2026-11-01",
      pieces: 248,
      ages: "9+",
      prices: ["US$22.99", "€19.99", "£17.99", "AU$29.99", "CA$29.99"],
      color: "#b9a6d8",
      lego: "https://www.lego.com/en-us/product/cozy-plants-10371",
      instructions: "https://www.lego.com/en-us/service/building-instructions/10371",
      review: "https://jaysbrickblog.com/reviews/review-lego-10371-cosy-plants/",
      about: "Two calming plants and the first accessories in the line: a hot drink for Momi and a book for Remi. LEGO's pre-release marketing didn't name them; the names come from the instruction booklets.",
      gallery: [
        LEGO_CDN + "blt253c1cfce17d3a48/10371_Prod.png",
        { src: LEGO_CDN + "blt019411fad9545d1a/10371_Box1_v39.png", caption: "Box front" },
        LEGO_CDN + "blt9f24203cc69cf3bf/blt65a82dd23fef35b0-10371_WEB_SEC01_NOBG.png",
        LEGO_CDN + "blt07226bef9c4919ce/blt65a82dd23fef35b0-10371_WEB_SEC02_NOBG.png",
        { src: LEGO_CDN + "bltf60650ce25653c09/blt65a82dd23fef35b0-10371_WEB_SEC03_NOBG.png", caption: "The plants swap between pots", fig: "momi" },
        LEGO_CDN + "blte4c998bf7233bb11/blt65a82dd23fef35b0-10371_Lifestyle_build.jpg",
        LEGO_CDN + "bltc17119b4d4d69e04/blt65a82dd23fef35b0-10371_Lifestyle_cons.jpg",
        LEGO_CDN + "bltd2ca2379fa169f4a/blt65a82dd23fef35b0-10371_Lifestyle_cons_2.jpg",
        LEGO_CDN + "bltbb57c313a23b94c3/blt65a82dd23fef35b0-10371_Lifestyle_envr.jpg",
        { src: LEGO_CDN + "bltcbf2abdfbd22fe0f/10371_Box5_v39.png", caption: "Box back" }
      ],
      figures: [
        {
          id: "momi",
          name: "Momi",
          plant: "Chamomile",
          latin: "Matricaria chamomilla",
          pot: "Lavender",
          color: "#b9a6d8",
          card: { src: LEGO_CDN + "blt253c1cfce17d3a48/10371_Prod.png", zoom: 1.6, x: 100, y: 85 },
          size: null,
          pose: "Sitting, arms and legs mounted on the front",
          feature: "First figure with front-mounted arms",
          extras: "Cup of tea",
          greeting: "Hi, I’m Momi. I’m a Chamomile plant!",
          story: "On your nose, a fresh scent – on your mind, a calming effect. This cheerful Chamomile loves cozy days with friends."
        },
        {
          id: "remi",
          name: "Remi",
          plant: "Peppermint",
          latin: "Mentha × piperita",
          pot: "Caramel brown",
          color: "#c98a4b",
          card: { src: LEGO_CDN + "blt253c1cfce17d3a48/10371_Prod.png", zoom: 1.6, x: 0, y: 60 },
          size: { h: 11, w: 8 },
          pose: "Lying down, legs out from the back",
          feature: "Arms fold onto the book",
          extras: "Brick-built book",
          greeting: "Hi, my name is Remi. I’m a Peppermint plant!",
          story: "This cool plant loves to spread both roots and stems – your fresh and fearless friend for flavor-filled adventures!"
        }
      ]
    }
  ]
};
