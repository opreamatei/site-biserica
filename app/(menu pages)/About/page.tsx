"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Logo from "@/components/optimized/components/Logo";

const aboutSections = [
  {
    description:
      "Alt hrisov al domnitorului afirmă că „biserica de la acel loc, ce se numește Foișor, este zidită de Doamna Smaranda cu hramul Nașterii Maicii Domnului”. Biserica este ridicată în imediata apropiere a casei domnești în anul 1745.",
    image: "/assets/imagine1.jpg",
    imageAlt: "Interiorul bisericii"
  },
  {
    description:
      "În același an, biserica este închinată de Constantin Mavrocordat, fiul lui Nicolae, ca metoc al mănăstirii Radu Vodă, proprietara pământurilor pe care au fost ridicate micul palat de vară și biserica Smarandei.",
    image: "/assets/imagine2.jpg",
    imageAlt: "Detaliu cu sfinti pictati pe pereti"
  },
  {
    description:
      "Constantin Mavrocordat confirmă în anul sfințirii bisericii autoritatea și proprietatea mănăstirii Radu Vodă atât asupra bisericii Foișor, cât și asupra „caselor de piatră”, dar și a „satului”, aflate toate pe moșia mănăstirii, din sudul Bucureștiului.",
    image: "/assets/imagine3.jpg",
    imageAlt: "Credinciosi reuniti in biserica"
  }
];

type ParallaxImageProps = {
  src: string;
  alt: string;
  direction: "left" | "right";
};

const ParallaxImage = ({ src, alt, direction }: ParallaxImageProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], direction === "left" ? [-30, 30] : [30, -30]);

  return (
    <div ref={ref} className="relative h-[260px] sm:h-[320px] md:h-[360px] lg:h-[420px]">
      <motion.div
        style={{ y }}
        className="relative h-full w-full overflow-hidden rounded-xl shadow-xl"
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 45vw, 520px"
        />
      </motion.div>
    </div>
  );
};

const MOBILE_MEDIA_QUERY = "(max-width: 768px)";

const AboutPage = () => {
  const [usePhoneImages, setUsePhoneImages] = useState(false);
  const [pressedId, setPressedId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window != "undefined") {

      const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
      const handleChange = (event: MediaQueryListEvent) => {
        setUsePhoneImages(event.matches);
      };

      setUsePhoneImages(mediaQuery.matches);
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  const diffuseSrc = usePhoneImages
    ? "/background/concrete_wall_003_diff_8k_phone.jpg"
    : "/background/concrete_wall_003_diff_8k.jpg";

  const displacementSrc = usePhoneImages
    ? "/background/concrete_wall_003_disp_8k_phone.png"
    : "/background/concrete_wall_003_disp_8k.png";

  const [showLongText, setShowLongText] = useState(false);
  useEffect(() => {
    if (showLongText) {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }


    return () => {
      document.body.style.overflow = "";
    };
  }, [showLongText]);

  const handlePressStart = (id: string) => {
    setPressedId(id);
  };

  const handlePressEnd = () => {
    setPressedId(null);
  };

  return (

    <div className="relative overflow-hidden bg-[#c59d30] pt-10 selection:bg-yellow-600 selection:text-black/90">
      <motion.div
        className="absolute inset-0 h-full w-full opacity-10 overflow-hidden"
        id="background-diffuse"
      >
        <Image
          fill
          priority
          quality={100}
          sizes="100vw"
          className="object-cover"
          alt="background"
          src={diffuseSrc}
        />
        <motion.div
          className="absolute inset-0 pointer-events-none mix-blend-color-burn"
        >
          <Image
            fill
            priority
            quality={100}
            sizes="100vw"
            className="object-cover"
            alt="background"
            src={displacementSrc}
          />
        </motion.div>
        <div className="h-full absolute" />
      </motion.div>


      <motion.div className="absolute inset-0 -z-10">
        <Image
          fill
          className="absolute inset-0 object-cover opacity-30"
          alt="Fundal texturat"
          src="/background/concrete_wall_003_diff_8k.jpg"
          sizes="100vw"
          priority
        />
      </motion.div>

      <motion.div
        initial={{ scale: 0.95, borderRadius: "30px", opacity: 0 }}
        animate={{ scale: 1, borderRadius: "0px", opacity: 1 }}
        exit={{ scale: 0.95, borderRadius: "30px", opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="relative z-2 min-h-screen  text-[#2b220a]"
      >
        <div className="mx-auto  md:px-[15vw] px-2 space-y-24">
          <header className="max-w-3xl px-10 py-20">
            <h1 className="mt-4 text-4xl font-semibold uppercase md:text-5xl">
              Istoricul bisericii
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#473712]">
              În arhiva mănăstirii Radu Vodă se află un hrisov al lui Nicolae Vodă Mavrocordat de la 2 mai 1724, arătând că: „pe moșia mănăstirii, din jos de București, pentru plimbarea măriei sale și a altor Domni, a făcut o pereche de case domnești, cu curte împrejur și cu grădină”.</p>
          </header>

          <div className="space-y-20">
            {aboutSections.map((section, index) => {
              const imageFirst = index % 2 === 0;

              return (
                <div
                  className="grid gap-10 grid-cols-2 md:items-center md:gap-16"
                >
                  <div className={imageFirst ? "order-1 md:order-1 self-center" : "order-2 md:order-2 self-center"}>
                    <ParallaxImage
                      src={section.image}
                      alt={section.imageAlt}
                      direction={imageFirst ? "left" : "right"}
                    />
                  </div>

                  <div
                    className={
                      imageFirst
                        ? "order-1 md:order-2 md:pl-12"
                        : "order-1 md:order-1 md:pr-12"
                    }
                  >
                    <p className="mt-4 text-base leading-relaxed text-[#463712]">
                      {section.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
            <p className="text-lg">Între anii 1888–1900 se realizează lucrări de reparații majore, iar în 1915 este învelit din nou acoperișul bisericii.</p>
        </div>
        <div className="flex justify-center mt-20">
          <button
            onClick={() => setShowLongText(true)}
            className={`px-6 py-3 bg-[#2b220a] text-[#e7d9a0] rounded-full shadow-lg hover:opacity-80 transition cursor-pointer transition-transform duration-150 ${pressedId === "about-more" ? "scale-95" : "scale-100"}`}
            onTouchStart={() => handlePressStart("about-more")}
            onTouchEnd={handlePressEnd}
          >
            Citește mai multe
          </button>
        </div>

        {showLongText && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowLongText(false)} // tap outside closes
          >
            <div className="relative bg-[#f7f0d6] text-[#2b220a] max-h-[70vh] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()} // prevents closing when tapping inside
            >

              <button
                onClick={() => setShowLongText(false)}
                className={`absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full hover:scale-110 transition transition-transform duration-150 ${pressedId === "about-close" ? "scale-95" : "scale-100"}`}
                onTouchStart={() => handlePressStart("about-close")}
                onTouchEnd={handlePressEnd}
              >
                <Image
                  src="/icons/close-circle.svg"
                  alt="close"
                  width={28}
                  height={28}
                />
              </button>

              <div className="p-6 overflow-y-auto max-h-[70vh] overscroll-contain leading-relaxed space-y-4"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-semibold mb-4">Istoric</h2>

                <p>
                  Nicolae Mavrocordat a fost primul domnitor fanariot în Țările Române. El era fiul
                  și mai celebrului Alexandru Mavrocordat Exaporitul, care făcuse studii
                  valoroase în Occident și ulterior a devenit mare dragoman și diplomat al
                  Imperiului Otoman. Nicolae Mavrocordat avea și el un înalt nivel de erudiție
                  care i-a adus de tânăr rolul de mare interpret al Porții. Prima domnie în Țara
                  Românească a avut loc între 10 februarie și 25 noiembrie 1716. Pe lângă dificultățile
                  interne, domnia lui a fost afectată de războiul dintre turci și austrieci, izbucnit
                  la câteva luni după înscăunarea sa. Conflictele sângeroase cu boierimea pământeană – a
                  executat câțiva mari boieri care complotaseră împotriva lui –, dar mai ales caterisirea
                  mitropolitului Antim (aliat al boierilor pământeni), surghiunit la muntele Sinai, însă
                  „ucis pe drum (…) de garda turcească ce-l însoțea”, dările exagerate la care a supus
                  populația Țării Românești și, mai ales, pe cea a Bucureștiului, aducerea permanentă
                  a unor trupe străine de arnăuți, tătari și turci care terorizau și jefuiau populația
                  locală au constituit un context social extrem de dificil de gestionat. Situațiile politice
                  frământate și pe plan extern, dar și adeziunile sau comploturile boierilor pământeni și
                  victoria austriecilor de la Petrovaradin (5 august) au culminat cu capturarea domnitorului
                  și a familiei sale și detenția de la Sibiu. Turcii l-au înlocuit pe Nicolae cu fratele lui,
                  Ioan Mavrocordat, care a domnit doi ani și jumătate. Bucureștiul a fost străbătut în decurs
                  de doi ani de un incendiu devastator, de ciumă adusă de „armatele turcești venite din Răsărit”,
                  secetă și foamete.
                </p>

                <p>
                  În 1719, Nicolae Mavrocordat revine ca domn al Țării Românești, această
                  a doua domnie, de 11 ani, fiind una prielnică refacerii țării și capitalei și
                  dezvoltării generale. „De astă dată el s-a arătat generos către boieri și drept
                  către țară în toate apucăturile lui”, a implementat mai multe reforme și a scăzut
                  dările. În 1724 a fost sfințită mănăstirea Văcărești, care pe lângă frumusețea
                  arhitecturii și bogăția componentelor artistice a fost înzestrată cu o bibliotecă
                  renumită printre contemporani. Domnitorul contribuie și la înălțarea sau înzestrarea
                  altor așezăminte religioase. Nicolae Mavrocordat a murit din cauza ciumei la 3 septembrie
                  1730 și a fost îngropat la mănăstirea Văcărești. La conducerea țării urmează Grigore al
                  II-lea Ghica, apoi ajunge domn și Constantin Mavrocordat, fiul lui Nicolae din cea de a
                  doua căsătorie, care a avut șase domnii în Țara Românească, ultima fiind între 1761–1763.
                </p>

                <p>
                  Constantin Mavrocordat va fi un reformator de bun augur. Printre alte măsuri
                  benefice – anularea multor dări –, în 1746 va desființa rumânia în Țara Românească,
                  iar puțin mai târziu va dezlega țărănimea din Moldova, datorită înscăunării lui
                  alternative pe tronurile celor două Principate. Doamna Smaranda era a treia soție
                  a lui Nicolae Mavrocordat, fiica paharnicului Panaiotache și a Smarandei Cremidi.
                  Copiii lor sunt Alexandru (n. 1720) și Sultana (n. 1721).
                </p>
                <p>
                  Un document din 1813, semnat de mitropolit, ne spune că în arhiva mănăstirii
                  Radu Vodă „se află un hrisov al lui Nicolae Vodă Mavrocordat de la 2 mai 1724,
                  arătând că: pe moșia mănăstirii, din jos de București, pentru plimbarea măriei
                  sale și a altor Domni, a făcut o pereche de case domnești, cu curte împrejur și
                  cu grădină”, iar alt hrisov al domnitorului afirmă că „biserica de la acel loc, ce
                  se numește Foișor, este zidită de Doamna Smaranda cu hramul Nașterii Maicii Domnului”.
                  Pisania săpată în piatră, aflată deasupra intrării din pridvor, ne transmite succint
                  cele mai importante informații despre arhitectură și ctitori:
                </p>
                <p>
                  „Această Sfântă și Dumnezeiască Biserică – hramul Nașterea Preasfintei Stăpânii noastre
                  Născătoarei de Dumnezeu și Pururea Fecioarei Maria – este din temelia ei zidită, zugrăvită
                  și înfrumusețată pe dinăuntru și pe din afară, până în săvârșit, precum se vede, cu toată
                  cheltuiala prealuminatei Măriei Sale Doamnei Zmaragdei, doamna fericitului și pururea
                  pomenitului răposatului Măriei Sale Ion Neculae Alexandru Voievod; săvârșindu-se în
                  zilele Prealuminatului și Înălțatului Domn Ioan Constantin Neculae Voievod, întru a
                  patra domnie a Măriei Sale aici în Țara Rumânească, pentru veșnica pomenire a Măriei
                  Sale și a părinților Măriei Sale și a tot luminatul neam al Măriei Sale. Și s-au
                  închinat a fi metoh Sfintei Mănăstiri Radului Voievod de aici din București, unde
                  se cinstește hramul Preasfintei Treimi, fiind și moșia iar a acestei Sfinte mănăstiri.
                  Și a fost ispravnic până la săvârșirea acestui dumnezeiesc lucru Pascale vel
                  ispravnic. De la zidirea lumii 7254, noiembrie 20.”
                </p>
                <p>
                  Subliniem anul zidirii 1745, așa cum a fost transcris în surse importante, și
                  nu anul 1746, așa cum apar uneori transcrieri eronate. Vom reține astfel ca
                  an al zidirii 1745, conform transcrierilor pisaniei și analizelor unor istorici
                  de referință, dată preluată și în LMI 2015, precum și în fișa de monument din Arhiva INP.
                </p>
                <p>
                  În anul 1745, biserica a fost închinată de Constantin Mavrocordat,
                  fiul lui Nicolae, ca metoh mănăstirii Radu Vodă, proprietara de facto a
                  pământurilor pe care au fost ridicate micul palat de vară și biserica Smarandei.
                  Constantin Mavrocordat confirmă în același an al sfințirii bisericii
                  autoritatea și proprietatea mănăstirii Radu Vodă atât asupra bisericii
                  Foișor, cât și asupra „caselor de piatră”, dar și a „satului”, aflate toate
                  pe moșia mănăstirii, din sudul Bucureștiului:
                </p>
                <p>
                  „Porunca lui Io Constantin Nicolae Voevod, domnul Țării Ungrovlahiei, prin
                  care dă sfintei și Dumnezeieștii mănăstiri Radu Vodă din orașul București și
                  cuviosului părinte chir Iosif egumenul, ca să aibă sub stăpânire casele de piatră
                  și biserica și satul care sunt pe moșia acestei mănăstiri din josul orașului
                  București, unde se numește Foișorul (…) pentru că, dintru a noastră bună voință
                  și dragoste către sfintele și Dumnezeieștile mănăstiri, ne-am îndemnat de am
                  închinat casele cu biserica și cu satul, ca să fie metoh Sfintei Mănăstiri a
                  Radului Vodă, și părinților călugări de ajutor și de chiverniseală, iar nouă
                  și răposaților părinți ai domniei noastre veșnică pomenire. (…) Octombrie 17,
                  leat 7254. Io Constantin Nicolae Voevod, din mila lui Dumnezeu domn.”
                </p>
                <p>
                  O altă inscripție, mai scurtă, aflată pe verso-ul ușii de acces, apropiată de etapa
                  sfințirii lăcașului, consemnează din nou numele ctitorului principal, Doamna Smaranda,
                  apoi: „Sandu vornicul; 18 dni ghenarie 1757; Stanciu ire(i) / pitropu ot Foișor /
                  Andrei dulgheru.” Această inscripție dă speranța că poate vor fi recuperate, în etapa
                  actuală de restaurare, numele zugravilor ansamblului mural.
                </p>
                <p>
                  Casele domnești din vecinătatea bisericii au fost construite cu câteva decenii înainte,
                  așa cum certifică documentul semnat „Io Nicolae Alexandru Voevod, cu mila lui Dumnezeu domn
                  Țării Ungrovlahiei”:
                </p>
                <p>
                  „Pentru că, vrând ca să fac domnia mea niște case domnești cu curte împrejur,
                  afară din oraș, ca să fie pentru plimbarea domniei mele și a altor domni ce s-ar
                  întâmpla a fi în urma domniei mele, și găsind domnia mea locul mai cu frumoasă
                  priveală din josul orașului domniei mele, pe moșia Sfintei Mănăstiri Radu Vodă
                  (…) am făcut domnia mea acele case domnești cu curtea împrejur și cu grădină,
                  precum se văd. Deci, fiind acest loc al mănăstirii, ca să nu aibă sfânta mănăstire
                  pagubă, domnia mea, din bună voință, împreună cu toți cinștiții și credincioșii boieri
                  ai domniei mele, am făcut această milă la sfânta mănăstire, ca să ia în toți anii de la
                  vistierie banii ce scriu mai sus, atât egumenul cât și alți egumeni ce vor fi la această
                  mănăstire, ca să fie sfintei mănăstiri de ajutor și domniei mele veșnică pomenire. Și
                  acești bani să-i aibă luarea în fiecare an, de la întâia zi a lunii Ghenarie.”
                </p>
                <p>
                  În anul 1737, când domnea Constantin Mavrocordat, casele și curtea Foișorului
                  au fost considerate punct strategic și pregătite pentru apărare pe fondul
                  conflictului dintre turci și austrieci, conflict care avea implicații directe
                  în domnia Țării Românești: „La casa de priveală (…) se întăriră turcii cu șanțuri
                  la 1737 (…). Se credea atunci că va fi bătalie între Nemți și Turci chiar în București.”
                </p>
                <p>
                  Cercetările arheologice realizate în 1964–1965 pentru identificarea vechilor case
                  domnești au clarificat aspecte legate de proporții, structură, materiale și stil,
                  datele din teren fiind confruntate cu planurile caselor din vechile hărți ale
                  Bucureștiului și cu o pictură din 1864 realizată de Henric Trenk, precum și cu alte informații.
                </p>
                <p>
                  Săpăturile au identificat locuința feudală suprapusă parțial pe o așezare mult mai
                  veche din secolele VI–VII e.n. Casele domnești aveau mici dimensiuni, ocupând
                  aproximativ 300 mp, erau adosate zidurilor de incintă ale ansamblului centrat
                  în jurul bisericii. Planul avea trei încăperi pe latura estică și trei spre vest,
                  legate printr-un coridor orientat nord–sud. Cea mai mare încăpere era cea dinspre
                  vest, probabil camera de oaspeți. „Intrarea în locuință presupunem că se făcea pe
                  latura nordică.”
                </p>
                <p>
                  În pictura lui Trenk, casele Mavrocordaților aveau bolți și arcade. Din cercetarea
                  arheologică nu există resturi care să confirme acest tip de construcție. Nu au
                  fost găsite nici resturi ale învelitorii caselor și nici urme ale culoarului de
                  lemn care ar fi legat această reședință de Mănăstirea Văcărești. Arheologii
                  consideră că materialele au fost sustrase de localnici și refolosite. Nici în
                  cazul „Foișorului” nu a fost identificat un perimetru clar sau elemente arhitecturale.
                </p>
                <p>
                  „Credem însă că pe laturile de nord-vest ale culoarului […] precum și pe
                  latura nordică a încăperii 5 au existat arcade deschise spre curte, care
                  permiteau și luminarea directă a camerelor 1, 2 și 6. Acest pridvor deschis
                  putea foarte bine să servească drept foișor și loc de privit, dar nu s-au găsit
                  elemente ale arcadelor, deoarece casa după părăsire a fost demantelată.”
                </p>
                <p>
                  Zonele deschise ale reședinței de vară ale Mavrocordaților erau orientate
                  spre orașul București și Dâmbovița. Concluzia arheologică este că „Aspectul
                  clădirii nu concordă însă cu pictura lui Trenk, iar planul ei nu-l întâlnim la
                  nicio locuință feudală românească.”
                </p>
                <p>
                  Cu toate acestea, satul și ulterior mahalaua Foișor primiseră denumirea de la
                  casele domnești „cu frumoasă priveală” – „această tradiție se spune de toți
                  bătrânii acelei mahalale.”
                </p>
                <p>
                  Alte materiale arheologice sunt sărăcăcioase: o monedă turcească din 1761,
                  ceramică smălțuită și nesmălțuită din secolele XVIII–XIX. Ele arată că
                  locuința a fost puțin timp folosită.
                </p>
                <p>
                  Pe lângă fluctuațiile domniilor lui Nicolae Mavrocordat sau situația dramatică din
                  timpul primei sale domnii, domnitorul folosea drept reședință și palatul de la Curtea
                  Veche, Cotroceni sau Mănăstirea Văcărești. Casele cu foișor au fost gândite ca reședință
                  temporară de vară și pentru oaspeți. „După cum ne informează Dapontes, domnul locuia uneori
                  în aceste case.” Incendiile devastatoare care distruseseră Bucureștiul fuseseră un motiv suplimentar
                  pentru ridicarea acestor locuințe.
                </p>
                <p>
                  „Poate tocmai lipsa de strălucire a acestei case domnești explică destinul ei obscur.
                  Cu excepția fiului ctitorului, ceilalți domni fanarioți au ignorat-o, iar însuși
                  Constantin Mavrocordat a folosit-o doar arareori, precum în 1737, când l-a primit
                  la «chioșcul prințului Nicolae» pe un pașă turc.”
                </p>
                <p>
                  Paragina sau degradarea Foișorului Mavrocordaților a fost consemnată în mai multe
                  rânduri în secolul al XIX-lea. În 1862, preotul Grigore Musceleanu nota că ruinele
                  caselor erau încă vizibile, inclusiv pivnițele.
                </p>
                <p>
                  În incinta bisericii, cercetările arheologice au descoperit în zona nord-vestică treizeci
                  de morminte, cu material arheologic sărăcăcios. Cel mai vechi mormânt a fost datat
                  cu ajutorul unui aspru turcesc din 1757. O parte din teren fusese alocat cimitirului
                  odată cu formarea mahalalei Foișor. Au mai fost găsite monede turcești de secol XVIII
                  și monede austriece și românești din secolul XIX.
                </p>
                <p>
                  În incinta bisericii, cercetările arheologice au descoperit în zona nord-vestică
                  treizeci de morminte, cu material arheologic sărăcăcios. Cel mai vechi mormânt a
                  fost datat cu ajutorul unui aspru turcesc din 1757. O parte din teren fusese alocat
                  cimitirului odată cu formarea mahalalei Foișor. Au mai fost găsite monede turcești
                  de secol XVIII și monede austriece și românești din secolul XIX.
                  Dezvoltarea cartierului și importanța spațiului sacru au determinat diverse refaceri ale
                  bisericii, în funcție de posibilitățile financiare. Există informații despre perioade de
                  degradare, precum documentul din 1813, când egumenul se plângea de „rea chiverniseală” și
                  cerea rânduirea unui călugăr îngrijitor, deoarece „biserica și zidurile ei ajunseseră la
                  stare proastă”.
                </p>
                <p>
                  Clădirea de reședință și anexele au căpătat diverse atribuții: han, școală (confirmată
                  printr-un raport din 1853) și altele. S-a păstrat informația existenței unui pod de lemn
                  care lega proprietatea de mănăstirea Văcărești. Ionescu Gion amintește că „Domnul
                  Fanariot (…) își face casă de priveală și răcoreală cu foișor (…) și un fel de gang
                  acoperit pe stâlpi care mergea până la mănăstirea Văcăreștilor.”
                </p>
                <p>
                  Colonelul Papazoglu descrie acest coridor ca fiind
                  „pe mulți stâlpi, cu ferestre pe ambele laturi, trecând peste
                  lunci, grădini și peste apa Dâmboviței cale de o jumătate de
                  oră.” Arheologia nu a confirmat însă material din care să fi rămas urme.
                </p>
                <p>
                  În ultimii ani ai secolului XIX se păstra informația unei
                  reparații din 1849, „de Moș Șerban și enoriași”. Terenul era băltos
                  până la realizarea canalizării. „Numirea de Foișorului îi vine de
                  la un turn ce era aici și de unde se observa asupra orașului.”
                </p>
                <p>
                  În 1898, parohia Foișor cuprindea 280 de enoriași și avea un venit
                  propriu de 1157 lei și 2600 subvenție de la stat. Capitalul gestionat
                  era de 8275 lei. Slujeau doi preoți, doi cântăreți și un paracliser.
                </p>
                <p>
                  O a doua pisanie, aflată deasupra celei vechi, descria reparații majore din 1888–1900:
                </p>
                <p>
                  „Acest Sfânt și Dumnezeiesc locaș s-a înfrumusețat și reparat pe dinafară și înăuntru, zugrăvit,
                  ferestrele mărite, după cum se găsesc, și amvonul făcut cu geamlicuri, în anul 1888–89. Iar în
                  anul 1889–1900 s-a zugrăvit amvonul din nou, un policandru făcut și mozaicul așezat, două clopote
                  noi făcute, pavaj în fața Bisericii și două felinare elegante cum se vede, în zilele I.P.S.
                  Mitropolit Iosif Gheorghian, primat al României (…) prin inițiativa și stăruințele neobosite
                  ale D-lor Epitropi: Pr. Cristache Atanasiu, Sandu Ruși, Vasile C. Bortică, cântărețul Răducanu
                  Vișeneanu și tuturor enoriașilor care au avut inimă pioasă și și-au dat obolul (…)”
                </p>
                <p>
                  În 1915 au fost adăugate spre sud-est o pivniță pentru lemne și o încăpere destinată veșmintelor,
                  cărților, icoanelor, explicitate de inscripția în marmură situată în acest spațiu. Cu această ocazie
                  a fost refăcută învelitoarea bisericii cu tablă de plumb:
                </p>
                <p>
                  „În zilele Preaînălțatului nostru Rege Ferdinand I, a soției sale Regina Maria,
                  a Înalt Preasfințitului Arhiepiscop și Mitropolit al Ungro-Vlahiei Conon Arămescu-Donici,
                  s-a învelit din nou cu tablă plumbuită Biserica Foișor din Capitală, cu ajutorul enoriașilor
                  acestei biserici. Această lucrare s-a executat în toamna anului 1914, iar în vara anului 1915
                  s-a ridicat din temelie vesmântarul, cu sumele necesare provenite…”
                </p>
              </div>
            </div>
          </div>
        )}
        
        <Logo />
      </motion.div>
    </div>
  );
};

export default AboutPage;





