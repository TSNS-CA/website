// Yeni Gelenler sayfası içeriği.
//
// Kaynak: eski Google Sites (www.tsns.ca/newcomers ve /newcomers/settlement-partnerships)
// ve orada gömülü "Halifax'a Yeni Gelen Rehberi" (Google Doc, ~2020, yalnızca TR).
// TR metinler kaynaktan aktarıldı (yazım hafifçe düzeltildi, üslup korundu);
// İngilizce gövdeler sadık özetlerdir. `verify` işaretli bölümlerdeki ücret /
// adres / süre bilgileri 2020 tarihlidir ve yönetim kurulunca teyit edilmelidir.
//
// Linkler: goo.gl kısaltmaları (Ağustos 2025'te kapandı) Google Maps aramasına,
// http:// adresler https'e, gov.ns.ca → novascotia.ca olarak güncellendi.

export const lastReviewed = "2026-10-17";
export const sourceYear = "2020";

const maps = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export const guide = {
  title: { tr: "Halifax'a Yeni Gelen Rehberi", en: "Newcomer's Guide to Halifax" },
  intro: {
    tr: [
      "Sevgili Yeni Halifaxlı! Uzun araştırmalar yapıp bundan sonraki hayatın için ciddi kararlar aldın, sana adeta yüzyıllar kadar uzun gelen bürokratik süreçlerden geçtin, stresli günler yaşadın; eski düzenini, iyi kötü anılarını, Türkiye'deki kariyerini geride bırakıp Halifax Uluslararası Havalimanı'na ulaştın. Hoş geldin! Bundan sonra seni yeni bir hayat bekliyor, umarız ki her şey gönlünce olur.",
      "Halifax'taki hayatına başlarken sana ve ailene gerekli olan gündelik bilgileri ve bürokratik işlemleri — ne? ne zaman? nasıl? nereden? — sorularının cevaplarını kısaca derledik.",
    ],
    en: [
      "Dear new Haligonian, welcome! You did the research, made big decisions, survived the paperwork and landed at Halifax Stanfield. A new life starts here, and we hope it turns out just as you wished.",
      "This guide collects the everyday information and paperwork you and your family will need in the first weeks: what, when, how and where.",
    ],
  },
  sections: [
    {
      id: "havaalani",
      icon: "✈️",
      title: { tr: "Havaalanından Halifax merkeze ulaşım", en: "Getting from the airport to downtown" },
      body: {
        tr: [
          "Halifax Havaalanı her ne kadar ıssız bir düzlüğün ortasındaymış gibi görünse de şehirden araba ile 30-35 dakika uzaklıkta yer alıyor. Eğer havaalanından sizi karşılayacak kimse yoksa paniğe kapılmayın: Dış Hatlar terminalinin çıkış kapısından sağa doğru yöneldiğinizde yol boyunca sıralanmış taksileri, sola doğru yöneldiğinizde ise otobüs duraklarını göreceksiniz.",
          "Şehir merkezine gelmek için Uber ya da taksi kullanmayı seçerseniz maliyeti 70-80 CAD civarında olacak; toplu taşımayı tercih ederseniz Halifax Transit'in 320 numaralı otobüsüne bineceksiniz. Yaklaşık 1 saat süren yolculuğun maliyeti çok daha düşük. Fakat çok valizle seyahat ediyorsanız taksi sizin için daha konforlu olacaktır.",
        ],
        en: [
          "Halifax Stanfield is about 30–35 minutes from downtown by car. Taxis line up to the right of the international arrivals exit; bus stops are to the left.",
          "A taxi or Uber downtown costs roughly 70–80 CAD. Halifax Transit route 320 takes about an hour and costs far less, though a taxi is more comfortable if you have a lot of luggage.",
        ],
      },
      links: [
        { label: { tr: "Halifax Transit — 320 havaalanı hattı", en: "Halifax Transit — Route 320 airport express" }, href: "https://www.halifax.ca/transportation/halifax-transit" },
        { label: { tr: "Halifax Stanford Havalimanı ulaşım bilgisi", en: "Halifax Stanfield airport — ground transportation" }, href: "https://halifaxstanfield.ca/" },
      ],
      verify: { tr: "Taksi ücreti ve 320 hattı bilgisi 2020 tarihli.", en: "Taxi fare and route 320 details date from 2020." },
    },
    {
      id: "konut",
      icon: "🏠",
      title: { tr: "Halifax'ta kiralık konut", en: "Renting a home in Halifax" },
      body: {
        tr: [
          "Halifax, Atlantik Kanada'nın en büyük şehri olduğundan sürekli göç alan ve gelişmekte olan bir şehir. Her geçen yıl Kanada dışından aldığı göçün ve uluslararası öğrenci sayısının artması sebebiyle kiralık konutta yetersizlik yaşanıyor; en azından devlet istatistikleri bu yönde.",
          "Halifax'ta (yani Kanada'da) ev kiralama Türkiye'dekinden biraz farklı işliyor. Türkiye'de evi ev sahibinden şahsen kiralayabiliyorsunuz; Kanada'da ise daire kiralama, bakım ve yönetim çoğunlukla profesyonel şirketler tarafından yürütülüyor ve kiracılığınız süresince ev sahibiyle değil apartman yöneticileriyle muhatap oluyorsunuz.",
          "Halifax bir öğrenci kenti olduğu için kiralık ev bulmak yılın belirli dönemlerinde zorlaşıyor. Mayıs-Haziran ayları ilanların en bol olduğu dönem; Temmuz sonuna kadar ev bulmak büyük problem olmuyor.",
          "HRM (Halifax Regional Municipality) bölgesinde — buna Dartmouth da dahil — kiralar değişiyor. Fiyat farkı sizi düşündürebilir; bu kesinlikle ucuz evler kötü muhitte, pahalılar iyi muhitte demek değil. Fiyat evin yaşına, özelliklerine ve elbette muhitine göre değişir. Şunu da unutmayın: Halifax'ta kira bedellerine çoğunlukla (%90) ısınma ve sıcak/soğuk su dahil. Ekim'den Nisan sonuna kadar ısıtmayı oldukça etkin kullandığımızı düşününce bu önemli bir kalem. İnternet dahil mi diye sormakta da büyük fayda var.",
        ],
        en: [
          "Halifax is Atlantic Canada's largest city and keeps growing, so rental supply is tight. Unlike Türkiye, most apartments are run by professional property-management companies: you deal with a building manager, not the owner.",
          "Because Halifax is a university town, listings peak in May–June and finding a place is easiest before the end of July.",
          "Rents vary across HRM (including Dartmouth) by building age, features and neighbourhood. In most buildings (about 90%) heat and hot water are included in the rent — a big deal from October to April — so always ask what is included, including internet.",
        ],
      },
      links: [],
    },
    {
      id: "ev-bulma",
      icon: "🔑",
      title: { tr: "Kiralık ev nasıl bulurum?", en: "How do I find a rental?" },
      body: {
        tr: [
          "En yaygın cevap Facebook Marketplace veya Kijiji. Kijiji için sahibinden.com'un Kanada versiyonu diyebiliriz: kiralık ev dahil araba, mobilya ve aklınıza gelebilecek her türlü eşyayı bulabileceğiniz bir site.",
          "Bunun yanında Halifax'ta faaliyet gösteren kiralama şirketlerinin kendi sitelerinden de bakabilirsiniz. Firmaların siteleri daha faydalı olabilir: evlerin planlarını görebilir, hangi tarihten itibaren boş olduğunu öğrenebilir, talep formu doldurabilir ve gezmek için randevu alabilirsiniz. Bazı firmalar siz hâlâ Türkiye'deyken form doldurmanıza, hatta uygun şartları sağladığınızda evi Türkiye'den kiralamanıza olanak sağlıyor.",
          "Web'de aramanın yanı sıra kiralık binalara gidip \"superintendent\"a kendinizi birebir tanıtmanın da çok faydası olduğunu belirtmek gerek. Umarız ev arama yolculuğunuz kısa sürer.",
        ],
        en: [
          "Start with Facebook Marketplace and Kijiji (Canada's classifieds site). Then check the websites of Halifax's property-management companies: you can see floor plans, availability dates, submit an application and book a viewing — some even let you apply from Türkiye.",
          "Visiting buildings in person and introducing yourself to the superintendent also helps a lot.",
        ],
      },
      links: [
        { label: { tr: "Kijiji — Halifax kiralık", en: "Kijiji — Halifax rentals" }, href: "https://www.kijiji.ca/" },
        { label: { tr: "Southwest Properties", en: "Southwest Properties" }, href: "https://southwest.ca/" },
        { label: { tr: "Olympus Properties Management", en: "Olympus Properties Management" }, href: "https://www.olympusproperties.ca/" },
        { label: { tr: "Northpoint Properties", en: "Northpoint Properties" }, href: "https://rentinhalifax.com/" },
        { label: { tr: "Killam Apartment REIT", en: "Killam Apartment REIT" }, href: "https://killamreit.com/" },
        { label: { tr: "Universal Realty Group", en: "Universal Realty Group" }, href: "https://universalgroup.ca/" },
      ],
    },
    {
      id: "okul",
      icon: "🏫",
      title: { tr: "Okul çağında çocuğum var, hangi okula yazdıracağım?", en: "Which school will my child attend?" },
      body: {
        tr: [
          "Kanada'da adrese dayalı okul sistemi olduğu için bu konu ev kiralamayla doğrudan ilgili. Okul çağında çocuğunuz varsa HRCE'nin (Halifax Regional Centre for Education) binanızın bulunduğu muhit için belirlediği ilkokul, ortaokul veya liseye kaydolması gerekiyor.",
          "Kanada iki resmi dili (İngilizce ve Fransızca) olan bir ülke olduğu için devlet okulları Fransızca eğitim veren French Immersion ve İngilizce eğitim veren okullar olarak ikiye ayrılıyor. Eğitim diline karar verdikten sonra HRCE'nin okul bulma aracına sokağınızın adını yazıyorsunuz; sistem bina numaralarını çift (even) ve tek (odd) olarak gruplanmış şekilde veriyor, kendi numaranızın bulunduğu aralığa tıkladığınızda çocuğunuzun hangi okula gideceği ve okulun sitesi açılıyor.",
          "Okul kayıt işlemlerinin nasıl yapıldığını ve hangi evrakların gerektiğini HRCE'nin kayıt sayfasında bulabilirsiniz.",
        ],
        en: [
          "Public schools are assigned by address. HRCE (Halifax Regional Centre for Education) decides which elementary, junior high or high school serves your building, so check it before you sign a lease.",
          "Schools are either English-program or French Immersion. Use HRCE's school locator: enter your street, pick the odd/even number range that includes your building, and it shows your assigned school. Registration steps and documents are on HRCE's registration page.",
        ],
      },
      links: [
        { label: { tr: "HRCE — okul bulma ve aileler için bilgi", en: "HRCE — families & school locator" }, href: "https://www.hrce.ca/families" },
        { label: { tr: "HRCE — öğrenci kaydı", en: "HRCE — student registration" }, href: "https://www.hrce.ca/families/student-registration-updates" },
      ],
    },
    {
      id: "sin",
      icon: "🪪",
      title: { tr: "Social Insurance Number (SIN) nedir, nasıl alınır?", en: "What is a SIN and how do I get one?" },
      body: {
        tr: [
          "Evinizi buldunuz, az çok yerleştiniz; rutin hayata kavuşmanıza az kaldı. Ama öncelikle SIN (Social Insurance Number) almanız gerekli. SIN, Kanada'da çalışmanız veya devlet programlarına ve yardımlarına erişmeniz için gereken 9 haneli bir numaradır; TC kimlik numarası gibi iş gören Kanada kimlik numarası olarak düşünebilirsiniz. Devlet daireleri sizden isteyecek. Kimlik ve kişisel bilgilerinize ulaşmanın anahtarı olduğundan yetkili kişiler hariç kimseyle paylaşmamalısınız.",
          "SIN almak için Service Canada Centre'a gidiyorsunuz. Önce danışmaya gidip SIN almak istediğinizi belirtiyorsunuz; bilgilerinizi aldıktan sonra sıra numarası verip beklemenizi istiyorlar. Sıranız geldiğinde görevli sizden izninizi (permit), adres bilgilerinizi ve geçerli kimliğinizi (pasaport) istiyor. Birkaç kişisel sorudan sonra size imzalamanız gereken belgeleri ve SIN'inizin yazılı olduğu evrağı teslim ediyor. Aile iseniz her bireyin ayrı ayrı başvurması gerekiyor; herkesin SIN'e ihtiyacı var.",
        ],
        en: [
          "The Social Insurance Number is the 9-digit number you need to work in Canada and to access government programs. Share it only with authorized parties.",
          "Apply at a Service Canada Centre (or online) with your work/study permit, proof of address and passport. Every family member needs their own SIN.",
        ],
      },
      links: [
        { label: { tr: "SIN — resmi başvuru sayfası (online başvuru da var)", en: "SIN — official page (online application available)" }, href: "https://www.canada.ca/en/employment-social-development/services/sin.html" },
        { label: { tr: "Service Canada Centre Halifax — harita", en: "Service Canada Centre Halifax — map" }, href: maps("Service Canada Centre Halifax NS") },
      ],
      verify: { tr: "SIN başvurusu artık online da yapılabiliyor; şube adımı eski yöntemi anlatır.", en: "SIN can now be requested online; the in-person steps describe the older process." },
    },
    {
      id: "kimlik",
      icon: "🆔",
      title: { tr: "Nova Scotia kimlik kartı (ID Card) nasıl alınır?", en: "Getting a Nova Scotia ID card" },
      body: {
        tr: [
          "Şimdi SIN aldığınıza göre ID Card (kimlik kartı) çıkartabilirsiniz. Bunun için Access Nova Scotia'ya gitmeniz gerekli; Halifax merkezde iki ofis bulunuyor (Halifax ve Dartmouth). Kapıdan girince danışmaya uğrayıp ID card çıkarmak istediğinizi söyleyip sıra numarası alıyorsunuz.",
          "Sıra size geldiğinde gişedeki görevli pasaport, permit ve SIN numaranızı isteyecek. Evrak kontrolünden sonra fotoğrafınız çekiliyor, kart ücretini ödüyorsunuz ve kimliğiniz verdiğiniz adrese yaklaşık 14 gün içinde posta ile gönderiliyor. Kartınız gelene kadar kullanmanız için geçici bir belge veriyorlar; yanınızda bulundurmanız iyi olur.",
        ],
        en: [
          "With your SIN in hand, apply for a Nova Scotia photo ID card at an Access Nova Scotia office (Halifax or Dartmouth). Bring your passport, permit and SIN. Your photo is taken, you pay the card fee, and the card is mailed within about two weeks; you get a temporary document meanwhile.",
        ],
      },
      links: [
        { label: { tr: "NS kimlik kartı — resmi bilgi", en: "Nova Scotia ID card — official page" }, href: "https://novascotia.ca/sns/paal/rmv/paal275.asp" },
        { label: { tr: "Access Nova Scotia Halifax — harita", en: "Access Nova Scotia Halifax — map" }, href: maps("Access Nova Scotia Halifax") },
        { label: { tr: "Access Nova Scotia Dartmouth — harita", en: "Access Nova Scotia Dartmouth — map" }, href: maps("Access Nova Scotia Dartmouth") },
      ],
      verify: { tr: "Kart ücreti 2020'de 17,70 $ idi; güncel ücret resmi sayfada.", en: "The fee was $17.70 in 2020; check the official page for the current fee." },
    },
    {
      id: "msi",
      icon: "🏥",
      title: { tr: "Sağlık kartı (MSI Health Card)", en: "Health card (MSI)" },
      body: {
        tr: [
          "Tebrikler, artık bir ID Card sahibisiniz. Sıra asıl önemli olan kısma, Health Card almaya geldi. MSI ofisi Dartmouth'ta City of Lakes Business Park'ta; Halifax'ta oturuyorsanız biraz uzun bir otobüs yolculuğu sizi bekliyor. Orada da sıra numarası almanız gerekli — Kanada'da alışmanız gereken şey beklemek.",
          "Sıranız geldiğinde görevliye health card çıkartmak istediğinizi belirtin. Yanınızda pasaport, permitleriniz ve ID card'larınız mutlaka bulunsun; adresinizi ezberlemeyi unutmayın. Acil durumda ulaşılacak kişi numarası isteyecekler; varsa bir tanıdığınızın numarasını vermeniz iyi olur. Evrak işlemlerinden sonra health card'ınızı basıp veriyorlar. Hayırlı olsun!",
        ],
        en: [
          "Nova Scotia's public health insurance is MSI. Register at the MSI office (historically in City of Lakes Business Park, Dartmouth) with your passport, permits and ID card; you will be asked for your address and an emergency contact. Check eligibility and current registration options on the official page first.",
        ],
      },
      links: [
        { label: { tr: "MSI — uygunluk ve kayıt (resmi)", en: "MSI — eligibility & registration (official)" }, href: "https://novascotia.ca/dhw/msi/" },
        { label: { tr: "MSI ofisi, City of Lakes Business Park — harita", en: "MSI office, City of Lakes Business Park — map" }, href: maps("MSI Medical Services Insurance City of Lakes Business Park Dartmouth NS") },
      ],
      verify: { tr: "Ofis adresi ve kayıt yöntemi 2020 tarihli; MSI kaydı artık kısmen online yapılabiliyor olabilir.", en: "Office location and process date from 2020; MSI may now offer online registration." },
    },
    {
      id: "aile-doktoru",
      icon: "🩺",
      title: { tr: "Aile doktoru arama, bulma", en: "Finding a family doctor" },
      body: {
        tr: [
          "Artık Health Card'ınız var; bu denklemde boş kalan kısım aile doktoru bulmak. Tavsiyemiz Need a Family Practice kayıt sistemine bekleme listesi için kaydolmanız.",
          "Ayrıca sık sık size yakın polikliniklere uğrayıp yeni hasta kabul eden doktor var mı diye sormanız gerekli. Hatta naçizane tavsiyemiz bir gününüzü doktor aramaya ayırmanız ve uygun Family Practice'leri tek tek gezip form doldurmanız. Form doldururken Health Card numaranıza ihtiyacınız olacak. Sosyal medyada zaman zaman yeni hasta kabul eden doktorların duyuruları yayınlanıyor; onlara da göz atarsanız süreci hızlandırmış olursunuz.",
          "Nova Scotia'daki yeni hayatınızda iyi şanslar diliyoruz. #birliktedahagüçlüyüz",
        ],
        en: [
          "Register on Nova Scotia Health's Need a Family Practice list, and also visit nearby clinics to ask whether any doctor is accepting new patients — bring your health card number. Social media groups often share openings too.",
          "Good luck in your new life in Nova Scotia. Together we are stronger!",
        ],
      },
      links: [
        { label: { tr: "Need a Family Practice — kayıt", en: "Need a Family Practice Registry" }, href: "https://needafamilypractice.nshealth.ca/" },
        { label: { tr: "811 — Nova Scotia sağlık danışma hattı", en: "811 — Nova Scotia health information line" }, href: "https://811.novascotia.ca/" },
      ],
    },
    {
      id: "ehliyet",
      icon: "🚗",
      title: { tr: "Ehliyet: Nova Scotia sürücü belgesine geçiş", en: "Driver's licence: switching to a Nova Scotia licence" },
      body: {
        tr: [
          "Nova Scotia'da sürücü belgeleri Registry of Motor Vehicles (RMV) tarafından, Access Nova Scotia ofislerinde verilir. Nova Scotia'ya yerleşenlerin 90 gün içinde Nova Scotia sürücü belgesi alması gerekir; bu süre boyunca geçerli yabancı ehliyetinizle araç kullanabilirsiniz.",
          "Nova Scotia'nın sınavsız ehliyet değişimi anlaşması yalnızca belirli ülkelerle var (resmi listede Avusturya, Belçika, Almanya, Man Adası, Güney Kore, Tayvan ve Birleşik Krallık yer alıyor). Türkiye bu listede olmadığından genellikle yazılı (bilgi) sınavı ve yol sınavı gerekir; önceki sürüş deneyiminiz belgelenebilirse kademeli ehliyet (GDL) sürelerinde indirim uygulanabilir. Güncel kuralları ve gerekli belgeleri mutlaka resmi sayfadan kontrol edin.",
          "Yol sınavına hazırlanmak ve Kanada trafiğine alışmak için aşağıdaki Six Sigma Sürüş Akademisi ortaklığımızdan yararlanabilirsiniz.",
        ],
        en: [
          "Licences are issued by the Registry of Motor Vehicles at Access Nova Scotia offices. New residents must obtain a Nova Scotia licence within 90 days; your valid foreign licence is accepted during that period.",
          "Nova Scotia exchanges licences without testing only with specific countries (the official list names Austria, Belgium, Germany, the Isle of Man, South Korea, Taiwan and the United Kingdom). Türkiye is not on that list, so a knowledge test and a road test are normally required; documented driving experience may shorten the graduated-licensing stages. Always confirm the current rules and documents on the official page.",
          "See our Six Sigma Driving Academy partnership below to prepare for the road test and Canadian traffic.",
        ],
      },
      links: [
        { label: { tr: "RMV — başka ülkeden ehliyet değişimi (resmi)", en: "RMV — exchange a licence from another country (official)" }, href: "https://novascotia.ca/exchange-your-out-of-province-drivers-licence/" },
        { label: { tr: "RMV — yeni gelenler için sürücü belgesi bilgisi", en: "RMV — licence information for new residents" }, href: "https://novascotia.ca/sns/paal/rmv/paal269.asp" },
        { label: { tr: "Registry of Motor Vehicles ana sayfa", en: "Registry of Motor Vehicles" }, href: "https://novascotia.ca/sns/rmv/" },
      ],
      verify: {
        tr: "Bu bölüm 2026'da resmi sayfalardan derlendi; karşılıklı anlaşma listesi ve sınav kuralları değişebilir, yönetim kurulu teyidi bekliyor.",
        en: "Compiled from official pages in 2026; the reciprocal list and testing rules can change — pending board review.",
      },
    },
  ],
};

export const partnerships = {
  isans: {
    id: "isans",
    name: "ISANS",
    fullName: { tr: "Immigrant Services Association of Nova Scotia", en: "Immigrant Services Association of Nova Scotia" },
    title: { tr: "ISANS – TSNS İşbirliği", en: "ISANS – TSNS Collaboration" },
    href: "https://isans.ca/",
    ctaHref: "https://isans.ca/start-your-journey-with-isans/",
    ctaLabel: { tr: "Start Your Journey with ISANS", en: "Start Your Journey with ISANS" },
    intro: {
      tr: [
        "Turkish Society of NS olarak topluluğumuza yeni katılan üyelerimizi karşılamak ve entegrasyonlarını desteklemek üzere harekete geçtik. ISANS – Nova Scotia Göçmen Hizmetleri Derneği'nin hizmetlerini hem yeni gelenlere hem de daha geniş göçmen topluluğumuza tanıtmak için işbirliği yaptık.",
        "Amacımız, tüm yeni gelenler için devlet ve farklı kuruluşlar tarafından finanse edilen hizmetlerle ilgili bilgiye erişilebilirliği artırmak.",
      ],
      en: [
        "As Turkish Society of NS we have taken action to welcome and support the integration of new members into our community. In collaboration with ISANS – Immigrant Services Association of Nova Scotia, we would like to introduce their services to both our newcomers and the wider immigrant community.",
        "Our goal is to increase accessibility of information for all newcomers to the full range of government-funded settlement and newcomer services available.",
      ],
    },
    eligibilityTitle: { tr: "Kim faydalanabilir?", en: "Who is eligible?" },
    eligibility: {
      tr: ["Kalıcı oturumu olanlar", "İltica etmiş olanlar", "Geçici çalışma izni sahipleri (TS-2023 sahipleri dahil)", "Uluslararası öğrenci olarak mezun olanlar"],
      en: ["Permanent residents", "Refugee claimants", "Temporary foreign workers (incl. TS-2023 holders)", "International student graduates"],
    },
    stepsTitle: { tr: "Nereden başlayacaksınız?", en: "How to start?" },
    steps: {
      tr: [
        "Start Your Journey with ISANS adresinden kayıt olun ve göçmenlik belgenizi (ör. çalışma izni) yükleyin.",
        "Kayıttan sonra en kısa sürede ISANS'ın dil seviyesi belirleme testine girin.",
      ],
      en: [
        "Register at Start Your Journey with ISANS and upload your immigration document.",
        "Complete your language assessment following registration.",
      ],
    },
    stepsNote: {
      tr: "Dil ile ilgili sorunlarınız olsa bile ISANS görevlileri her İngilizce seviyesi için uygun iş olduğunu belirtiyor.",
      en: "Even if you have issues with language skills at the start, ISANS ensures there are jobs available for every level of English.",
    },
    servicesTitle: { tr: "Hangi hizmetler var?", en: "What services are available?" },
    services: [
      {
        icon: "🗣️",
        title: { tr: "Dil destek hizmetleri", en: "Language support services" },
        body: {
          tr: "Dil becerinize ve çalışmak istediğiniz alana bağlı olarak özel öğretmen, konuşma dersleri, kütüphane dersleri gibi ileri dil kursları için uygun olabilirsiniz (mültecilerin uygunluk koşulları farklıdır).",
          en: "Based on your language skill and the area you want to work in, you may be eligible for further language classes such as a private tutor, conversation classes or library language programs (refugees have different eligibility).",
        },
      },
      {
        icon: "💼",
        title: { tr: "İş bulma desteği", en: "Employment support services" },
        body: {
          tr: "Bridge to Work programı (güvenlik eğitimi, iş arama atölyeleri, giriş seviyesi işler için iş geliştirme; inşaat ve hizmet sektörü için düşük dil seviyesi yeterli), iş danışmanlığı ve iş arama desteği (özgeçmiş, ön yazı, mülakat hazırlığı, network). Dil seviyeniz CLB 5+ ise muhasebe/finans, eczacı, doktor, hemşire ve diş hekimleri için köprü programlarına (klinik beceri programı, lisans sınavlarına hazırlık) erişebilirsiniz.",
          en: "Bridge to Work program (safety training, job-search workshops and job development for entry-level jobs in construction and the service industry), employment counselling and job-search support (resume, cover letter, interview prep, networking). At CLB 5+ you can access bridging programs in accounting/finance, pharmacy, medicine, nursing and dentistry (clinical skills program and licensure exam preparation).",
        },
      },
      {
        icon: "🚀",
        title: { tr: "Kendi işinizi kurma desteği", en: "Starting your own business" },
        body: {
          tr: "İş eğitimi ve iş danışmanlığı hizmetleri.",
          en: "Business training and business counselling services.",
        },
      },
    ],
    footnote: {
      tr: "Farklı bir kuruluştan hizmet alıyorsanız bile ISANS'a başvurmaktan çekinmeyin; ISANS yalnızca yeni gelenlere ve göçmenlere hizmet veren bir kuruluş.",
      en: "If you are receiving service from a different organization, do not hesitate to approach ISANS — they are solely dedicated to newcomers and immigrants.",
    },
  },
  driving: {
    id: "six-sigma",
    name: "Six Sigma Driving Academy",
    title: { tr: "Yeni Gelen Yol Testi ve Kanada Trafiğine Hazırlık", en: "Newcomer Traffic Readiness" },
    subtitle: { tr: "Six Sigma Sürüş Akademisi ortaklığı", en: "Six Sigma Driving Academy partnership" },
    href: "https://www.sixsigmadrivingacademy.ca/",
    packageTitle: { tr: "Yeni Gelen Yol Testi paketi", en: "Newcomer Road Test package" },
    packageFor: { tr: "Türkiye trafiğinde kendine güvenen sürücüler için (toplam 5 saat)", en: "For already confident drivers in Turkish traffic (total 5 hours)" },
    items: {
      tr: [
        "1 saatlik deneme yol testi — seviye belirleme",
        "3 saat (2 × 1,5 saat) bireysel bire bir eğitim — güven artırma",
        "Yol testi öncesinde 1 saat ısınma dersi",
        "Yol testi için okul aracının kullanılması",
        "Kurslar profesyonel sürüş eğitmenleri tarafından geliştirilmiştir",
      ],
      en: [
        "1-hour mock road test — initial assessment",
        "3 hours (2 × 1.5 h) individual one-on-one training — confidence building",
        "1-hour warm-up lesson prior to the road test",
        "Use of the school vehicle for the road test",
        "Courses developed by professional driving instructors",
      ],
    },
    pitch: {
      tr: "Sadece yol sınavınıza hazırlanmakla kalmayın; deneyimli eğitmenlerle yerel trafikteki sürüş hatalarınızı azaltın, Kanada yollarına ve kış sürüşüne hazırlanın. Eğitmenimiz Yusuf biraz Türkçe de konuşabiliyor!",
      en: "Not only get ready for your road exam, but also reduce your driving errors in local traffic with experienced instructors and prepare for Canadian roads and winter driving. Instructor Yusuf also speaks some Turkish!",
    },
    price: { tr: "210 $ + vergi", en: "$210 + tax" },
    discount: {
      tr: "TSNS üyelerine %10 indirim. Özel kodunuz için bize DM atabilir veya info@tsns.ca adresine yazabilirsiniz. Ek ders gerekirse 1 saatlik dersler indirimle 42,50 $/saat.",
      en: "10% discount for TSNS members — DM us or email info@tsns.ca for your code. Further 1-hour lessons are $42.50/hr with discount eligibility.",
    },
    verify: { tr: "Fiyatlar 2024 tarihli; güncel fiyatı akademiye teyit ettirin.", en: "Prices date from 2024; confirm current pricing with the academy." },
    ctaMail: "mailto:info@tsns.ca?subject=Six%20Sigma%20TSNS%20indirim%20kodu",
  },
};

export const supportOrgs = [
  { name: "ISANS — Immigrant Services Association of Nova Scotia", region: "NS", href: "https://isans.ca/", blurb: { tr: "Nova Scotia'nın ana yerleşim kuruluşu: dil, iş, köprü programları.", en: "Nova Scotia's main settlement agency: language, employment, bridging programs." } },
  { name: "YMCA Halifax–Dartmouth — Immigrant Services", region: "NS", href: "https://www.yishfx.ca/", blurb: { tr: "Tüm YMCA'lerden destek alabilirsiniz; gençlik ve aile programları.", en: "All YMCAs can provide support; youth and family programs." } },
  { name: "Immigrant & Refugee Services Association PEI", region: "PEI", href: "https://www.irsapei.ca/", blurb: { tr: "Prince Edward Island'da yeni gelen hizmetleri.", en: "Newcomer services in Prince Edward Island." } },
  { name: "Settlement Services for Newcomers — New Brunswick", region: "NB", href: "https://www2.gnb.ca/content/gnb/en/corporate/promo/immigration/living-in-nb/settlement-services.html", blurb: { tr: "New Brunswick eyaletinin resmi yerleşim hizmetleri rehberi.", en: "Province of New Brunswick's official settlement services directory." } },
  { name: "Association for New Canadians — Newfoundland & Labrador", region: "NL", href: "https://ancnl.ca/", blurb: { tr: "Newfoundland ve Labrador'da yeni gelen desteği.", en: "Newcomer support in Newfoundland and Labrador." } },
];

export const linkGroups = [
  {
    id: "ns-links",
    title: { tr: "Kanada ve Nova Scotia'dan bilgiler", en: "Info about Atlantic Canada & Nova Scotia" },
    links: [
      { label: { tr: "Nova Scotia'dan haberler (Toronto Star Halifax)", en: "News from Nova Scotia (Toronto Star Halifax)" }, href: "https://www.thestar.com/halifax.html" },
      { label: { tr: "Halifax hava durumu", en: "Weather for Halifax & NS" }, href: "https://www.theweathernetwork.com/ca/weather/nova-scotia/halifax" },
      { label: { tr: "Nova Scotia tanıtım sitesi", en: "Nova Scotia tourism" }, href: "https://www.novascotia.com/" },
      { label: { tr: "Kanada Göçmenlik (IRCC)", en: "Canada & Immigration (IRCC)" }, href: "https://www.canada.ca/en/immigration-refugees-citizenship.html" },
      { label: { tr: "Kanada e-Devlet", en: "Government of Canada" }, href: "https://www.canada.ca/" },
      { label: { tr: "Nova Scotia Eyalet resmi sitesi", en: "Government of Nova Scotia" }, href: "https://novascotia.ca/" },
      { label: { tr: "Kanada'nın Türkçe Sesi — web sitesi", en: "Turkish Voice of Canada — website" }, href: "https://turkishvoiceofcanada.ca/" },
      { label: { tr: "Bizim Anadolu Gazetesi (Türkçe Kanada gazetesi)", en: "Bizim Anadolu — Turkish-Canadian newspaper" }, href: "https://www.bizimanadolu.com/" },
    ],
  },
  {
    id: "turkey-links",
    title: { tr: "Türkiye'den bağlantılar", en: "Links from Türkiye" },
    links: [
      { label: { tr: "Türkiye'yi tanıtıcı videolar (Kültür ve Turizm Bakanlığı)", en: "Introduction to Türkiye (Ministry of Culture & Tourism)" }, href: "https://tanitma.ktb.gov.tr/TR-132462/turkiye-tanitim-videolari.html" },
      { label: { tr: "Türkiye'den gazeteler", en: "Newspapers from Türkiye" }, href: "https://www.haberler.com/gazeteler/" },
      { label: { tr: "Türkiye online TV", en: "Online TV from Türkiye" }, href: "https://www.canlitv.legal/tv3" },
      { label: { tr: "Türkiye online radyolar", en: "Online radios from Türkiye" }, href: "https://www.canliradyodinle.fm/radyolar/turkce-pop-radyolari" },
      { label: { tr: "Türkiye hava durumu (MGM)", en: "Weather in Türkiye (MGM)" }, href: "https://www.mgm.gov.tr/tahmin/turkiye.aspx" },
    ],
  },
  {
    id: "official-links",
    title: { tr: "Resmî temsilcilikler", en: "Official representations" },
    links: [
      { label: { tr: "T.C. Ottawa Büyükelçiliği", en: "Embassy of Türkiye in Ottawa" }, href: "https://ottava.be.mfa.gov.tr/" },
      { label: { tr: "e-Konsolosluk", en: "Turkish e-Consulate" }, href: "https://www.e-konsolosluk.net/" },
      { label: { tr: "T.C. Toronto Başkonsolosluğu", en: "Consulate General of Türkiye in Toronto" }, href: "https://toronto.bk.mfa.gov.tr/" },
    ],
  },
];

// Sayfanın sonunda listelenir: 2020 tarihli bilgiler; yönetim kurulu teyidi bekleyenler.
export const verifyList = {
  tr: [
    "Access Nova Scotia kimlik kartı ücreti (2020: 17,70 $).",
    "SIN artık online alınabiliyor; şube anlatımı eski süreç.",
    "MSI kayıt ofisinin adresi ve online kayıt seçeneği.",
    "Six Sigma Driving Academy paket fiyatı ve üye indirimi (2024).",
    "ISANS uygunluk listesindeki 'TS-2023' ifadesi (2023 deprem sonrası süreli izin).",
    "Havaalanı taksi ücreti ve 320 numaralı hat.",
    "Ehliyet bölümündeki karşılıklı anlaşma listesi ve sınav kuralları.",
  ],
  en: [
    "Access Nova Scotia ID card fee (2020: $17.70).",
    "SIN can now be requested online; the branch walkthrough is the older process.",
    "MSI registration office address and online registration option.",
    "Six Sigma Driving Academy package price and member discount (2024).",
    "The 'TS-2023' item in ISANS eligibility (a time-limited permit after the 2023 earthquake).",
    "Airport taxi fare and route 320.",
    "Reciprocal-country list and testing rules in the driver's licence section.",
  ],
};
