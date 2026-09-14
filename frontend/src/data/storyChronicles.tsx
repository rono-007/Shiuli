import React from 'react';
import { Landmark, Sparkles, Flame, Palette, Hourglass } from 'lucide-react';

export interface StorySectionParagraph {
  heading?: string;
  text: string[];
}

export interface StoryContent {
  subtitle?: string;
  sections: StorySectionParagraph[];
}

export interface Story {
  id: string;
  num: string;
  tagBn: string;
  tagEn: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  accent: string;
  titleColor: string;
  cardBg: string;
  cardBorder: string;
  cardBorderHover: string;
  innerBorder: string;
  badgeBg: string;
  badgeBorder: string;
  watermarkColor: string;
  flourishColor: string;
  btnBg: string;
  btnHoverBg: string;
  btnText: string;
  icon: React.ReactNode;
  isReady: boolean;
  contentEn: StoryContent;
  contentBn: StoryContent;
}

export const storiesData: Story[] = [
  // -------------------------------------------------------------
  // STORY 01: When the Goddess Stepped Beyond the Courtyard
  // -------------------------------------------------------------
  {
    id: 's1',
    num: '01',
    tagBn: 'ঐতিহ্য',
    tagEn: 'Heritage',
    titleBn: 'যখন দেবী পৌঁছলেন উঠোন পেরিয়ে',
    titleEn: 'When the Goddess Stepped Beyond the Courtyard',
    descBn: 'জমিদারবাড়ির ঠাকুরদালান পেরিয়ে কীভাবে বারোয়ারি পুজোর জন্ম হল এবং সাধারণ মানুষের পুজোয় রূপান্তরিত হল।',
    descEn: 'How Durga Puja stepped out of aristocratic courtyards into community streets and transformed Bengal forever.',
    accent: '#7A1F26',
    titleColor: 'text-[#5C1117]',
    cardBg: 'bg-gradient-to-b from-[#FFF5F6] via-[#FDF0F2] to-[#FAE2E6]',
    cardBorder: 'border-[#E8B8C0]',
    cardBorderHover: 'hover:border-[#7A1F26]',
    innerBorder: 'border-[#7A1F26]/20',
    badgeBg: 'bg-[#FBE4E8]',
    badgeBorder: 'border-[#E8AAB4]',
    watermarkColor: 'text-[#7A1F26]/10',
    flourishColor: '#7A1F26',
    btnBg: 'bg-[#7A1F26]',
    btnHoverBg: 'hover:bg-[#5C1117]',
    btnText: 'text-white',
    icon: <Landmark className="w-4 h-4 text-[#7A1F26]" />,
    isReady: true,
    contentEn: {
      subtitle: 'From the mansion to the neighbourhood: The story of how Durga Puja became truly our own.',
      sections: [
        {
          text: [
            "There was a time when Durga Puja in Bengal could be spectacular and yet remain largely behind the walls of a wealthy household.",
            "In the eighteenth and nineteenth centuries, some of Bengal's grandest celebrations were organised by zamindars, merchants and affluent families. The Goddess was worshipped in family courtyards, often amid elaborate ritual, music, feasting and entertainment. But a household Puja was still controlled by its host: who could enter, where visitors could stand and how far outsiders could participate depended on the family. The public Durga Puja that now seems inseparable from Kolkata was therefore not always the dominant form of the festival.",
            "The transformation began outside Kolkata."
          ]
        },
        {
          heading: "The puzzle of Guptipara",
          text: [
            "Guptipara in Hooghly district occupies a crucial place in the history of Bengal's community Puja. Government records describe the town as a pioneer of the public or Barowari model: a group of local men formed a committee, collected subscriptions and organised worship collectively rather than leaving it in the hands of a single household.",
            "The familiar explanation of the name is wonderfully simple: baro means twelve and yar means friend or companion—hence baro-yari, the enterprise of twelve friends.",
            "But this is exactly where a careful history needs a warning label.",
            "Different sources give dates such as 1759, 1761 and around 1790 for the beginning of the Guptipara tradition. An important surviving clue is an article published in The Friend of India in May 1820. It described a new form of worship called “Barowaree” that had arisen at Guptipara roughly thirty years earlier. It stated that a group formed an association, elected twelve men as a committee and sought subscriptions from surrounding villages.",
            "There is an even more interesting complication: that 1820 report describes the community's successful celebration of Jagaddhatri, rather than giving us an uncomplicated document saying, “the first public Durga Puja began here in year X.” Later histories closely connect Guptipara's Barowari model with Durga Puja, and government sources recognise Guptipara as the pioneer of today's public Durga celebrations. The safest historical conclusion, therefore, is this:",
            "Guptipara was a crucial birthplace of Bengal's community-funded Barowari system in the late eighteenth century, but the precise date and details of the “first public Durga Puja” should not be stated as unquestioned fact.",
            "That uncertainty actually makes the story more fascinating rather than less."
          ]
        },
        {
          heading: "A revolutionary idea: Chanda",
          text: [
            "What made Barowari worship different was not simply where the idol stood. It changed who could create a festival.",
            "Instead of depending entirely upon one wealthy patron, organisers collected contributions from many people. The 1820 account records subscriptions being sought from surrounding villages. In other words, the familiar Bengali institution of Pujor chanda has roots reaching back to the early history of community worship.",
            "A few coins from one person, a larger contribution from another, labour from someone else—together they could create what no individual household could afford.",
            "Durga Puja was slowly becoming not merely something people came to see, but something a community could claim as its own."
          ]
        },
        {
          heading: "From Barowari to Sarbojanin",
          text: [
            "The idea spread, eventually reshaping Kolkata.",
            "A major landmark came at Balaram Basu Ghat Road in Bhawanipore in 1910, where the Sanatan Dharmotsahini Sabha organised an early community Durga Puja. Census India's Hooghly district handbook also identifies 1910 as an important moment in the transition from Barowari to Sarbajanin. Sahapedia similarly records the Balaram Basu Ghat Road Puja as an early landmark in Kolkata's community-Puja history.",
            "Sarbojanin literally carries the idea of being for everyone.",
            "The distinction was bigger than a change of terminology. The Puja was moving from the private courtyard into neighbourhood streets, parks and public grounds. A para could now organise its own Goddess, its own decorations, its own cultural programmes and eventually its own artistic identity.",
            "Public Pujas also became intertwined with the social and political life of twentieth-century Bengal. During the nationalist period, community gatherings provided spaces in which collective identity and political ideas could circulate alongside religious celebration."
          ]
        },
        {
          heading: "The little revolution that became Kolkata",
          text: [
            "Look at Kolkata during Puja today and the result of that transformation is everywhere.",
            "One neighbourhood debates its theme. Another collects subscriptions. Volunteers manage queues. Local residents serve bhog. Craftspeople arrive from districts across Bengal. Children grow up identifying themselves with “our Puja.” And millions of strangers enter pandals without needing an invitation from the owner of a palace.",
            "In 2021, UNESCO inscribed Durga Puja in Kolkata on the Representative List of the Intangible Cultural Heritage of Humanity. UNESCO specifically recognised its extraordinary combination of public religion, art, craftsmanship and collective participation, noting that Puja committees, families, priests, drummers, artists and craftspeople are all among the tradition's bearers.",
            "That makes the history of Barowari Puja more than a story about twelve friends.",
            "It is the story of a festival changing its address—\n\n• from the mansion to the neighbourhood,\n• from patronage to participation,\n• from “their Puja” to “amader Pujo”—our Puja."
          ]
        }
      ]
    },
    contentBn: {
      subtitle: 'জমিদারবাড়ির ঠাকুরদালান থেকে পাড়ার বারোয়ারি প্রাঙ্গণ — সাধারণের পুজো হয়ে ওঠার রক্তমাংসের ইতিবৃত্ত।',
      sections: [
        {
          text: [
            "বাংলায় দুর্গাপূজার এমন একটা সময় ছিল, যখন উৎসবের ঐশ্বর্য ছিল দেখার মতো—তবু তা আবদ্ধ থাকত বনেদি বা ধনী পরিবারের চারদেয়ালের ভেতরেই।",
            "আঠারো ও উনিশ শতকে বাংলার সবচেয়ে আড়ম্বরপূর্ণ পুজোগুলো আয়োজন করতেন জমিদার, ধনী বণিক ও সম্ভ্রান্ত পরিবারবর্গ। দেবী পূজিত হতেন ঠাকুরদালান বা পারিবারিক উঠোনে; চারপাশে থাকত বৈদিক আচার, উচ্চাঙ্গ সংগীত, খেমটা-যাত্রা, ভুরিভোজ ও রাজকীয় মেহমানদারি। কিন্তু পারিবারিক পুজোর সর্বময় কর্তৃত্ব থাকত সেই পরিবারের হাতেই—কার প্রবেশের অধিকার আছে, বহিরাগতরা কতটা দূরে দাঁড়াবে, কিংবা কে কতটুকু প্রসাদ পাবে, তা নির্ধারিত করত গৃহস্বামীর সামাজিক মর্যাদা। আজকের যে প্রকাশ্য ও উন্মুক্ত দুর্গাপূজা আমরা কলকাতায় দেখি, তা কিন্তু প্রথম থেকেই এমন ছিল না।",
            "এই নিস্তব্ধ প্রাচীর ভাঙার বিপ্লব শুরু হয়েছিল কলকাতার সীমানার বাইরে।"
          ]
        },
        {
          heading: "গুপ্তিপাড়ার বারো-ইয়ারি ধাঁধা",
          text: [
            "হুগলি জেলার গুপ্তিপাড়া বাংলার সামাজিক ও বারোয়ারি পুজোর ইতিহাসে এক অনন্য তীর্থক্ষেত্র। ব্রিটিশ আমলের নথিপত্র এবং সরকারি গ্যাজেটিয়ারে এই জনপদকে বারোয়ারি বা গণ-পুজোর পথিকৃৎ হিসেবে উল্লেখ করা হয়েছে—যেখানে কোনো এক ধনী ব্যক্তির ওপর নির্ভর না করে, স্থানীয় একদল মানুষ সমিতি গড়ে, চাঁদা তুলে সমষ্টিগতভাবে পূজার আয়োজন করেন।",
            "এই নামের জনপ্রিয় ও চমৎকার ব্যাখ্যাটি আমরা সবাই জানি: 'বারো' মানে বারোজন, আর 'ইয়ার' মানে বন্ধু বা দোস্ত—অর্থাৎ বারোজন বন্ধুর যৌথ উদ্যোগ বা 'বারো-ইয়ারি'।",
            "কিন্তু একনিষ্ঠ ইতিহাসের পাতায় নজর দিলে বিষয়টি আরও রহস্যময় ও তাৎপর্যপূর্ণ হয়ে ওঠে।",
            "বিভিন্ন ঐতিহাসিক সূত্রে গুপ্তিপাড়ার এই সূচনার সাল হিসেবে ১৭৫৯, ১৭৬১ কিংবা ১৭৯০ খ্রিস্টাব্দের কথা পাওয়া যায়। তবে সবচেয়ে নির্ভরযোগ্য প্রাচীন লিখিত দলিলটি মেলে ১৮২০ সালের মে মাসে প্রকাশিত 'দ্য ফ্রেন্ড অফ ইন্ডিয়া' (The Friend of India) সাময়িকীতে। সেখানে উল্লেখ করা হয়, প্রায় তিরিশ বছর আগে (অর্থাৎ আনুমানিক ১৭৯০ সালে) গুপ্তিপাড়ায় 'বারোয়ারি' নামক এক অভিনব পূজারীতি জন্ম নেয়, যেখানে ১২ জন ব্যক্তি একটি কমিটি গড়ে আশেপাশের গ্রামগুলো থেকে চাঁদা সংগ্রহ করেছিলেন।",
            "মজার ব্যাপার হলো, ১৮২০ সালের ওই প্রতিবেদনে এটি স্পষ্ট করে বলা হয়েছিল গুপ্তিপাড়ার জগদ্ধাত্রী পুজোর সাফল্যের কথা, সরাসরি 'প্রথম সর্বজনীন দুর্গাপূজা' হিসেবে নয়। তবে পরবর্তী ইতিহাস ও সরকারি দলিল গুপ্তিপাড়ার এই বারোয়ারি ভাবাদর্শকেই আধুনিক সর্বজনীন দুর্গাপূজার আঁতুড়ঘর হিসেবে স্বীকৃতি দিয়েছে। তাই ইতিহাসের সবচেয়ে যুক্তিযুক্ত সত্য হলো:",
            "গুপ্তিপাড়া ছিল আঠারো শতকের শেষভাগে বাংলার গণ-অর্থায়নে পরিচালিত বারোয়ারি ব্যবস্থার এক যুগান্তকারী সূতিকাগার, কিন্তু 'প্রথম বারোয়ারি দুর্গাপূজা'র নিখুঁত দিনক্ষণ ইতিহাসের এক চিরন্তন রোমাঞ্চকর রহস্য।",
            "এই ঐতিহাসিক রহস্যময়তা গল্পটিকে ম্লান করে না, বরং আরও আকর্ষণীয় করে তোলে।"
          ]
        },
        {
          heading: "এক বৈপ্লবিক ধারণা: চাঁদা",
          text: [
            "বারোয়ারি প্রথা কেবল দেবীর অধিষ্ঠানের জায়গাটুকুই বদলে দেয়নি; এটি বদলে দিয়েছিল উৎসব সৃষ্টির অধিকারকে।",
            "একজন বিত্তবান জমিদারের খেয়ালখুশির ওপর নির্ভর না করে, উদ্যোক্তারা সমাজের সর্বস্তরের মানুষের কাছ থেকে অংশিদারিত্ব সংগ্রহ করতে শুরু করলেন। ১৮২০ সালের নথিতে পাশের গ্রামগুলি থেকেও অনুদান সংগ্রহের উল্লেখ আছে। সোজা কথায়, আজকের বাঙালি জীবনের যে চিরচেনা প্রতিষ্ঠান—'পুজোর চাঁদা'—তার শিকড় প্রোথিত ছিল সেই গণ-আন্দোলনের প্রথম পর্বে।",
            "কারও কাছ থেকে সামান্য কয়েক আনা পয়সা, কারও কাছ থেকে সাধ্যমতো বেশি অর্থ, আবার কারও দৈহিক শ্রম ও সহযোগিতা—সব মিলিয়ে তৈরি হলো এমন এক উৎসব, যা কোনো একক পরিবারের পক্ষে একা করা অসম্ভব ছিল।",
            "দুর্গাপূজা তখন আর দূর থেকে দেখার 'তাদের উৎসব' রইল না; তা হয়ে উঠল গোটা সম্প্রদায়ের নিজস্ব উৎসব।"
          ]
        },
        {
          heading: "বারোয়ারি থেকে সর্বজনীন",
          text: [
            "গুপ্তিপাড়া থেকে ছড়িয়ে পড়া এই আগুনের ফুলকি একসময় কলকাতার বুকে আছড়ে পড়ল এবং শহরের সামাজিক মানচিত্র চিরতরে বদলে দিল।",
            "১৯১০ সালে কলকাতার ভবানীপুরের বলরাম বসু ঘাট রোডে 'সনাতন ধর্মোৎসাহিনী সভা'র হাত ধরে এক ঐতিহাসিক সন্ধিক্ষণ রচিত হয়। ভারতের আদমশুমারি নথিপত্র এবং সাহাপিডিয়ার গবেষণায় ১৯১০ সালের এই ঘটনাটিকে বারোয়ারি থেকে 'সর্বজনীন' রূপান্তরের অন্যতম প্রথম ভিত্তিপ্রস্তর হিসেবে চিহ্নিত করা হয়েছে।",
            "'সর্বজনীন' শব্দের আক্ষরিক অর্থই হলো—যা সকলের তরে, যার ওপর অধিকার প্রতিটি মানুষের।",
            "এটি কেবল নামের পরিবর্তন ছিল না। পুজো পারিবারিক দালানকোঠা আর সংকীর্ণ গণ্ডি পেরিয়ে চলে এল রাজপথ, উদ্যান আর উন্মুক্ত মাঠে। প্রতিটি পাড়া এবার নিজের মতো করে দেবীকে সাজাতে শুরু করল, জন্ম নিল পাড়ার নিজস্ব সংস্কৃতি, ঐক্য আর শৈল্পিক স্বকীয়তা।",
            "বিশ শতকের স্বদেশী ও স্বাধীনতা আন্দোলনের সময় এই সর্বজনীন পুজোমঞ্চগুলো হয়ে উঠল জাতীয়তাবোধের উন্মেষকেন্দ্র। বিপ্লবীরা দেবীর মহাশক্তি রূপকে মাতৃভূমির মুক্তির প্রতীক হিসেবে বরণ করলেন।"
          ]
        },
        {
          heading: "ছোট্ট এক বিপ্লব, যা আজ কলকাতা",
          text: [
            "আজ শরতের কলকাতায় তাকালে সেই মহাবিপ্লবের চিহ্ন প্রতিটি গলিতে দৃশ্যমান।",
            "এক পাড়ায় ঘণ্টার পর ঘণ্টা থিম নিয়ে তুমুল তর্ক চলছে। অন্য পাড়ায় তরুণরা চাঁদা কাটছে। স্বেচ্ছাসেবকরা ভিড় সামলাচ্ছে। পাড়ার মাসি-পিসিরা বসে ভোগের খিচুড়ি আর লাবড়া বিতরণ করছেন। মেদিনীপুর, নদীয়া, বাঁকুড়া থেকে শিল্পীরা আসছেন মণ্ডপ গড়তে। নতুন প্রজন্ম বড় হচ্ছে তাদের 'পাড়ার পুজো'র গর্ব বুকে নিয়ে। আর লক্ষ লক্ষ অচেনা মানুষ রাজপ্রাসাদের অনুমতিপত্র ছাড়াই মাথা উঁচু করে প্রবেশ করছেন অপরূপ সব মণ্ডপে।",
            "২০২১ সালে ইউনেস্কো কলকাতার দুর্গাপূজাকে মানবজাতির 'অস্পর্শনীয় সাংস্কৃতিক ঐতিহ্য' (Intangible Cultural Heritage of Humanity) হিসেবে স্বীকৃতি দেয়। ইউনেস্কো বিশেষভাবে তুলে ধরেছে এর গণধর্মীয় উন্মাদনা, শিল্পকলা, কারুশিল্প এবং সমষ্টিগত অংশগ্রহণের সেই অনন্য মেলবন্ধনকে—যেখানে ক্লাব কমিটি, পুরোহিত, ঢাকি, মৃৎশিল্পী আর সাধারণ দর্শক সবাই এই ঐতিহ্যের অবিচ্ছেদ্য অংশীদার।",
            "তাই বারোয়ারি পুজোর ইতিহাস কেবল বারোজন বন্ধুর কাহিনী নয়।",
            "এটি একটি উৎসবের ঠিকানা বদলের ঐতিহাসিক মহাকাব্য—\n\n• রাজপ্রাসাদ থেকে পাড়ার গলিপথে,\n• জমিদারি অনুদান থেকে সার্বিক জনঅংশগ্রহণে,\n• 'তাদের পুজো' থেকে আমাদের পুজোয় রূপান্তর।"
          ]
        }
      ]
    }
  },

  // -------------------------------------------------------------
  // STORY 02: Evolution of Pandal Design
  // -------------------------------------------------------------
  {
    id: 's2',
    num: '02',
    tagBn: 'শিল্প ও স্থাপত্য',
    tagEn: 'Art & Architecture',
    titleBn: 'প্যান্ডেল ডিজাইনের বিবর্তন',
    titleEn: 'Evolution of Pandal Design',
    descBn: 'একটি ক্ষণস্থায়ী আশ্রয় কীভাবে রূপ নিল শহরের উন্মুক্ত শিল্প প্রদর্শনীতে — বাঁশের কাঠামো থেকে থিম পুজোর মহাজাগতিক রূপান্তর।',
    descEn: 'How a temporary shelter became a city-sized art gallery — from humble bamboo scaffolds to immersive public installations.',
    accent: '#B86B12',
    titleColor: 'text-[#613603]',
    cardBg: 'bg-gradient-to-b from-[#FFFDF5] via-[#FFF8E6] to-[#FDF0D2]',
    cardBorder: 'border-[#EAD096]',
    cardBorderHover: 'hover:border-[#B86B12]',
    innerBorder: 'border-[#B86B12]/20',
    badgeBg: 'bg-[#FDF0D0]',
    badgeBorder: 'border-[#EAC678]',
    watermarkColor: 'text-[#B86B12]/10',
    flourishColor: '#B86B12',
    btnBg: 'bg-[#B86B12]',
    btnHoverBg: 'hover:bg-[#945209]',
    btnText: 'text-white',
    icon: <Sparkles className="w-4 h-4 text-[#B86B12]" />,
    isReady: true,
    contentEn: {
      subtitle: 'How a Temporary Shelter Became a City-Sized Art Gallery',
      sections: [
        {
          text: [
            "Every autumn, Kolkata performs an architectural miracle.",
            "A park that was empty in July becomes a palace in September. A street corner becomes a forgotten village. Bamboo disappears beneath sculpture, textiles and light. Familiar neighbourhoods turn into forests, temples, ships, imagined worlds or spaces built around memory, social questions and folk culture.",
            "Then, only days later, much of it disappears.",
            "That impermanence is not a flaw in the art of the pandal.\nIt is part of its identity."
          ]
        },
        {
          heading: "Before the “theme”",
          text: [
            "The word pandal refers to the temporary pavilion that houses the deity and accommodates worshippers. Historically, its basic function was practical: it created a protected ceremonial space.",
            "Temporary pavilions are certainly not a recent invention. A nineteenth-century Kolkata print in the Metropolitan Museum of Art, dated approximately 1850–70, already shows Durga enthroned within a portable pavilion resembling those used for the annual festival. Another late nineteenth-century work records the curved chaalchitra framing associated with portable Durga shrines.",
            "The chaalchitra deserves attention of its own. Traditionally positioned behind or above the Durga tableau, this painted decorative backdrop could contain religious scenes and motifs. It was art before anyone began using the modern phrase “theme pandal.”",
            "So Kolkata did not suddenly discover artistic Puja decoration in the modern era. The festival had long combined sculpture, painting, architecture, ornament and performance.",
            "What changed was scale, concept and artistic freedom."
          ]
        },
        {
          heading: "Bamboo: the skeleton beneath the spectacle",
          text: [
            "Behind many extravagant pandals lies a remarkably humble material: bamboo.",
            "The extensive 2019 research project commissioned by the West Bengal Tourism Department and carried out through the British Council describes pandals as temporary structures commonly supported by frameworks of bamboo poles and covered or transformed using decorative materials. The report notes that construction may begin three to four months before Puja.",
            "That means the spectacular five-day experience visitors see is often the result of months of work.",
            "Bamboo workers create the skeleton. Craftspeople construct surfaces and ornamentation. Electricians wire the structure. Artists control the visual language. Lighting specialists transform it at night. Sound designers may add a dedicated soundscape. Committees coordinate safety, finance and crowds.",
            "A modern pandal is therefore rarely the work of one “decorator.”\nIt is a temporary creative industry."
          ]
        },
        {
          heading: "When the pandal became the artwork",
          text: [
            "Over time, Puja committees moved beyond decorating a shelter and began conceptualising the entire visitor experience.",
            "The British Council research records pandals addressing subjects such as environmental concerns, humanity, womanhood, folk culture and migrant workers. It also documents the increasing participation of professionally trained artists alongside traditional craftspeople.",
            "That shift changed pandal-hopping itself.",
            "Visitors no longer came only to see the idol.\nThey came to enter an idea.",
            "A theme could begin at the queue, continue through a corridor, change through sound and light, culminate at the Goddess and reveal another detail on the way out. Architecture became storytelling.",
            "This is why some of Kolkata's best pandals function almost like immersive installations rather than conventional decorated halls.",
            "UNESCO's description of Durga Puja reflects precisely this transformation: it calls the festival a thriving ground for collaborative artists and designers and highlights its large-scale installations and pavilions."
          ]
        },
        {
          heading: "Bengal's crafts found a giant stage",
          text: [
            "Theme pandals also became unusual showcases for traditional materials.",
            "The British Council study documents the use of jute, sholapith and terracotta in Kolkata pandals. It gives examples of wood carving, shola decoration and other regional crafts being commissioned on a scale that brought both income and public visibility to artisans.",
            "Sholapith is particularly striking. The soft white interior of an aquatic plant has long been used for delicate ceremonial decoration in Bengal. In a pandal, a material that can appear fragile in the hand may be multiplied thousands of times until it forms walls, crowns, flowers and enormous decorative surfaces.",
            "The same festival can bring together rural bamboo, traditional clay work, folk painting, contemporary sculpture, digital lighting and trained installation artists.",
            "That collaboration is one reason a pandal is difficult to categorise.\n\nIs it architecture?\nSculpture?\nCraft?\nTheatre?\nPublic art?\n\nDuring Durga Puja, it can be all of them."
          ]
        },
        {
          heading: "Light became architecture too",
          text: [
            "The visual transformation does not end with the structure.",
            "The 2019 creative-economy mapping identifies Chandannagar as an important centre of illumination artistry whose workers and lighting installations travel to Kolkata during festival season.",
            "At night, light can create an architecture that did not exist during the day: moving patterns, animated scenes, changing façades and illuminated routes connecting one Puja to another.",
            "The city itself becomes part of the installation."
          ]
        },
        {
          heading: "The economy behind the beauty",
          text: [
            "The scale is enormous.",
            "The British Council–West Bengal Tourism study estimated that, for 2019, pandal-making activity across West Bengal was worth about ₹860 crore. The wider creative economy surrounding Durga Puja—including installation art, idols, illumination, crafts, advertising, retail, food, tourism and related industries—was estimated at ₹32,377 crore, equivalent in that study to approximately 2.58% of West Bengal's GSDP. These are 2019 research estimates, not present-day figures.",
            "That economic dimension matters because the beauty visible to a visitor represents months of livelihoods for designers, labourers, sculptors, painters, bamboo workers, electricians, dhakis, lighting crews and craftspeople.",
          ]
        },
        {
          heading: "And then it disappears",
          text: [
            "Perhaps the strangest feature of pandal art is that everyone involved knows it will not last.",
            "An architect usually designs to resist time.\nA Puja artist designs knowing time is part of the work.",
            "For a few autumn nights the structure becomes one of the most photographed places in the city. Crowds queue for hours. Millions of eyes examine details that took months to construct.",
            "And then the lights go off.\nThe bamboo is dismantled.\nThe road returns.",
            "That is why Kolkata's pandals are not simply temporary buildings.\nThey are memories designed in three dimensions."
          ]
        }
      ]
    },
    contentBn: {
      subtitle: 'একটি ক্ষণস্থায়ী আশ্রয় কীভাবে হয়ে উঠল পুরো শহরের উন্মুক্ত আর্ট গ্যালারি',
      sections: [
        {
          text: [
            "প্রতি শরতে কলকাতা এক বিস্ময়কর স্থাপত্যের জাদু রচনা করে।",
            "শ্রাবণে যে খেলার মাঠ বা পার্কটি খাঁ খাঁ করছিল, আশ্বিন আসতেই তা পরিণত হয় ইন্দ্রপুরীর মতো রাজপ্রাসাদে। ব্যস্ত রাস্তার এক কোণ হয়ে ওঠে সুদূর গ্রামবাংলার মাটির কুটির। বাঁশ আর দড়ির কাঠামো ঢেকে যায় ভাস্কর্য, বয়নশিল্প আর চোখধাঁধানো আলোয়। পরিচিত পাড়াগুলো রাতারাতি রূপান্তরিত হয় প্রাচীন মন্দির, মহাসমুদ্রের জাহাজ, মহাকাশ কিংবা সমাজ-ভাবনা আর লোকসংস্কৃতির অমূল্য ক্যানভাসে।",
            "তারপর, মাত্র কয়েকটা দিন পেরোতেই, তার সিংহভাগই বাতাসে মিলিয়ে যায়।",
            "এই ক্ষণস্থায়িত্ব মণ্ডপশিল্পের কোনো ত্রুটি বা ব্যর্থতা নয়।\nএটাই তার আসল আত্মপরিচয়।"
          ]
        },
        {
          heading: "'থিম' যুগের আগে",
          text: [
            "'প্যান্ডেল' বা মণ্ডপ শব্দটির আদি অর্থ দেবীর বিগ্রহ ও পুণ্যার্থীদের সাময়িক ছাদ বা আচ্ছাদন। ঐতিহাসিকভাবে এর মূল উদ্দেশ্য ছিল নিতান্তই বাস্তবসম্মত: রোদ-বৃষ্টি থেকে দেবীকে রক্ষা করার একটি সুরক্ষিত আচারিক পরিমণ্ডল গড়ে তোলা।",
            "তবে এই সাময়িক আচ্ছাদনের শিল্পভাবনা একেবারেই আধুনিক আবিষ্কার নয়। নিউ ইয়র্কের মেট্রোপলিটন মিউজিয়াম অফ আর্টে সংরক্ষিত আনুমানিক ১৮৫০–৭০ সালের একটি পুরনো কলকাতার লিথোগ্রাফে দেখা যায়, বার্ষিক উৎসবের আদলে তৈরি বহনযোগ্য মণ্ডপের ভেতরে দেবী দুর্গা আসীন। উনিশ শতকের শেষভাগের চিত্রে চালচিত্রের সূক্ষ্ম বাঁক ও নকশার ঐতিহাসিক উপস্থিতিও স্পষ্ট।",
            "এই চালচিত্রের নিজস্ব এক অপরূপ শিল্পইতিহাস আছে। প্রতিমার পেছনে অর্ধবৃত্তাকার বা খাঁজকাটা এই চালচিত্রে পটুয়ারা আঁকতেন শিবের সংসার, কৈলাসের দৃশ্য কিংবা পৌরাণিক আখ্যান। আধুনিক 'থিম প্যান্ডেল' শব্দবন্ধটি চালু হওয়ার বহু আগেই এটি ছিল বাংলার নিজস্ব মণ্ডপশিল্প।",
            "কাজেই কলকাতা আধুনিক যুগে হঠাৎ করে শিল্পমগ্ন পুজো আবিষ্কার করেনি। আবহমান কাল থেকেই এই উৎসবে মিশে ছিল ভাস্কর্য, পটচিত্র, স্থাপত্য, সজ্জা আর লোকনাট্যের মহাসম্মেলন।",
            "যা বদলেছে তা হলো স্কেল বা পরিধি, দার্শনিক ভাবনা এবং শিল্পীর সৃজনশীল স্বাধীনতা।"
          ]
        },
        {
          heading: "বাঁশ: মহাযজ্ঞের নেপথ্য কঙ্কাল",
          text: [
            "যে কোনো চোখধাঁধানো রাজকীয় মণ্ডপের নেপথ্যে দাঁড়িয়ে থাকে এক চিরন্তন বিনম্র উপাদান: বাংলার বাঁশ।",
            "২০১৯ সালে পশ্চিমবঙ্গ সরকারের পর্যটন দপ্তর ও ব্রিটিশ কাউন্সিলের যৌথ গবেষণাপত্রে মণ্ডপকে বর্ণনা করা হয়েছে এমন এক অস্থায়ী স্থাপত্য হিসেবে, যার মূল মেরুদণ্ড গঠিত হয় লাখ লাখ বাঁশ ও মজবুত নারকোল দড়ির বাঁধনে, যা পরবর্তীতে রূপান্তরিত হয় নান্দনিক শৈল্পিক রূপকাঠামোয়। এই নির্মাণযজ্ঞ শুরু হয় পুজোর তিন থেকে চার মাস আগে থেকেই।",
            "অর্থাৎ দর্শনার্থীরা যে পাঁচ দিনের মায়াবী দৃশ্য প্রত্যক্ষ করেন, তা গড়ে ওঠে শত শত মানুষের দীর্ঘ মাসের রক্তঘামে।",
            "মেদিনীপুরের বাঁশমিস্ত্রিরা দাঁড় করান বিশালাকার কঙ্কাল। পটুয়া ও কারুশিল্পীরা গড়ে তোলেন বহিরাবরণ ও নিখুঁত অলংকরণ। ইলেকট্রিশিয়ানরা মাইলের পর মাইল তারের জাল বোনেন। বিশিষ্ট ফাইন আর্টস শিল্পীরা পরিচালনা করেন রঙের আবহ। আলো ও শব্দ নির্মাতারা তৈরি করেন রাতের মহাজাগতিক আবহ। আর পুজো কমিটি সামলায় নিরাপত্তা, অর্থায়ন আর জনতার বাঁধভাঙা স্রোত।",
            "আধুনিক মণ্ডপ তাই কেবল একজন 'ডেকোরেটর'-এর কাজ নয়।\nএটি এক সুবিশাল ক্ষণস্থায়ী সৃজনশীল শিল্প-বাণিজ্য।"
          ]
        },
        {
          heading: "যখন মণ্ডপ নিজেই হয়ে উঠল এক শিল্পকর্ম",
          text: [
            "সময়ের সাথে সাথে পুজো কমিটিগুলো নিছক প্রতিমা রক্ষার ছাদ তৈরি থেকে সরে এসে পুরো দর্শনার্থী অভিজ্ঞতার এক অখণ্ড ধারণায়ন (conceptualisation) করতে শুরু করে।",
            "ব্রিটিশ কাউন্সিলের সেই নথিপত্রে উল্লেখ রয়েছে কীভাবে কলকাতার মণ্ডপগুলোতে পরিবেশ সচেতনতা, মানবতাবাদ, নারীশক্তি, লোকসংস্কৃতি এবং এমনকি পরিযায়ী শ্রমিকদের জীবনের মতো গভীর সামাজিক বিষয়গুলো উঠে এসেছে। সেই সাথে চিরাচরিত কারিগরদের পাশাপাশি গভর্নমেন্ট আর্ট কলেজের পেশাদার শিল্পীদের সরাসরি অংশগ্রহণের কথাও নথিভুক্ত হয়েছে।",
            "এই পরিবর্তনের হাত ধরেই কলকাতার 'প্যান্ডেল হপিং' সংস্কৃতির মোড় ঘুরে যায়।",
            "মানুষ আর কেবল প্রতিমা দর্শনে বের হন না।\nতাঁরা আসেন একটি সম্পূর্ণ শিল্পভাবনার ভেতরে প্রবেশ করতে।",
            "লম্বা লাইনের ব্যারিকেড থেকেই শুরু হয় সেই শৈল্পিক যাত্রা, যা এগিয়ে চলে মণ্ডপের অলিন্দ দিয়ে, আলো ও আবহসঙ্গীতের রূপান্তরের মধ্য দিয়ে দেবীর পাদদেশে এসে পূর্ণতা পায় এবং বের হওয়ার পথে রেখে যায় আরও কিছু চিন্তার খোরাক। স্থাপত্য এখানে হয়ে ওঠে জীবন্ত গল্পগাথা।",
            "তাই কলকাতার শ্রেষ্ঠ পুজোমণ্ডপগুলো সাধারণ সাজানো ঘরের চেয়ে বিশ্বমানের 'ইমার্সিভ আর্ট ইন্সটলেশন' হিসেবে বেশি কাজ করে।",
            "ইউনেস্কোর দুর্গাপূজা মূল্যায়নেও এই বিষয়ের ভূয়সী প্রশংসা করা হয়েছে: এটিকে শিল্পী ও ডিজাইনারদের সম্মিলিত সৃজনশীলতার এক অনন্ত উর্বর ভূমি হিসেবে চিহ্নিত করে এর সুবিশাল উন্মুক্ত পাবলিক আর্টের স্বীকৃতি দেওয়া হয়েছে।"
          ]
        },
        {
          heading: "বাংলার লোকশিল্প খুঁজে পেল মহাজাগতিক মঞ্চ",
          text: [
            "থিম পুজোর এই জোয়ার বাংলার ঐতিহ্যবাহী গ্রাম্য উপাদান ও হস্তশিল্পীদের জন্য এনে দিয়েছে এক অনন্য জাতীয় ও আন্তর্জাতিক মঞ্চ।",
            "পাট, শোলা, টেরাকোটা, কাঠখোদাই, ডোকরা, মাদুর এবং পটের মতো লোকজ উপাদান কলকাতার মণ্ডপগুলোতে যে বিশাল আয়তনে ব্যবহৃত হয়, তা গ্রামীণ কারিগরদের কেবল বিপুল অর্থনৈতিক স্বাচ্ছন্দ্যই দেয়নি, দিয়েছে কোটি কোটি দর্শকের সম্মান ও স্বীকৃতি।",
            "বিশেষ করে শোলার কাজ এক জাদুকরি অনুভূতি দেয়। জলে ভাসা অতি নমনীয় এক জলজ উদ্ভিদের নরম সাদা মজ্জা, যা হাতে নিলে মনে হয় হাওয়ায় উড়ে যাবে—মণ্ডপে তা-ই হাজার হাজার গুণ বিবর্ধিত হয়ে তৈরি করে বিশালাকার দেয়াল, মুকুট, পদ্মবন আর অপার্থিব অলংকরণ।",
            "একই মহোৎসবে মিলেমিশে একাকার হয়ে যায় পল্লীগ্রামের বাঁশ, নদীর মাটি, লোকজ পটচিত্র, সমসাময়িক ধাতু-ভাস্কর্য, ডিজিটাল আলোকসজ্জা আর প্রাতিষ্ঠানিক শিল্পীদের কল্পনা।",
            "এই সমন্বয়ের কারণেই একটি পুজোমণ্ডপকে নির্দিষ্ট কোনো ছকে বাঁধা অসম্ভব।\n\nএটি কি স্থাপত্য?\nনাকি ভাস্কর্য?\nনাকি কারুশিল্প?\nনাকি মঞ্চনাটক?\nনাকি গণমানুষের আর্ট গ্যালারি?\n\nদুর্গাপূজার এই কয়েকটা দিনে, এটি এই সবকটিরই এক অবিশ্বাস্য যুগলবন্দি।"
          ]
        },
        {
          heading: "আলো যখন নিজেই এক স্থাপত্য",
          text: [
            "মণ্ডপের এই রূপান্তর কেবল মাটির কাঠামোতেই থেমে থাকে না।",
            "চন্দননগরের আলোকশিল্পীদের কারিগরি দুর্গাপূজার রাতের রূপকে অনন্য উচ্চতায় নিয়ে যায়। তাঁদের তৈরি চলমান আলোর মালা, পৌরাণিক ও সমসাময়িক অ্যানিমেশন এবং গেটগুলো কলকাতার এক প্রান্ত থেকে অন্য প্রান্তে আলোর সেতু রচনা করে।",
            "রাতের অন্ধকারে আলো এমন এক স্থাপত্য রচনা করে যা দিনের বেলায় অদৃশ্য ছিল: ছায়ার খেলা, জীবন্ত চরিত্র আর আলো ঝলমল রাজপথ।",
            "আস্ত শহরটাই তখন হয়ে ওঠে এক বিশাল প্রদর্শনী।"
          ]
        },
        {
          heading: "এই সৌন্দর্যের পেছনের বিশাল অর্থনীতি",
          text: [
            "এই উৎসবের অর্থনৈতিক ব্যাপ্তি শুনলে চোখ কপালে ওঠার মতো।",
            "ব্রিটিশ কাউন্সিল ও পশ্চিমবঙ্গ সরকারের ২০১৯ সালের সমীক্ষা অনুযায়ী, শুধুমাত্র মণ্ডপ তৈরির কর্মকাণ্ডেই পশ্চিমবঙ্গে প্রায় ৮৬০ কোটি টাকার বাণিজ্য হয়েছিল। আর দুর্গাপূজাকে কেন্দ্র করে যে সমগ্র সৃজনশীল অর্থনীতি—যার মধ্যে শিল্প-স্থাপত্য, প্রতিমা, আলোকসজ্জা, বিজ্ঞাপন, বস্ত্রশিল্প, খাদ্য ও পর্যটন অন্তর্ভুক্ত—তার মোট অর্থনৈতিক মূল্যমান ছিল প্রায় ৩২,৩৭৭ কোটি টাকা, যা তৎকালীন রাজ্যের জিএসডিপির প্রায় ২.৫৮ শতাংশের সমান।",
            "এই অর্থনৈতিক দিকটি অত্যন্ত তাৎপর্যপূর্ণ, কারণ দর্শনার্থীর চোখে যে স্বর্গীয় রূপ ভেসে ওঠে, তার পেছনে জড়িয়ে থাকে লক্ষ লক্ষ ডিজাইনার, শ্রমিক, মৃৎশিল্পী, রিকশাচালক, পটুয়া, ইলেকট্রিশিয়ান ও ঢাকিদের সারা বছরের বেঁচে থাকার সংস্থান।"
          ]
        },
        {
          heading: "এবং তারপর... সব মিলিয়ে যায়",
          text: [
            "মণ্ডপশিল্পের সম্ভবত সবচেয়ে অদ্ভুত এবং হৃদয়গ্রাহী সত্য হলো: এর সাথে যুক্ত প্রতিটি মানুষ জানেন যে এটি চিরস্থায়ী নয়।",
            "একজন প্রথাগত স্থপতি ভবন বানান সময়কে জয় করার জন্য।\nআর একজন পুজোর শিল্পী মণ্ডপ গড়েন এই সত্য জেনে যে, সময় নিজেই তাঁর শিল্পকর্মের এক ক্ষণস্থায়ী অংশ।",
            "আশ্বিনের চার-পাঁচটি মায়াবী রাতে এই মণ্ডপগুলো হয়ে ওঠে বিশ্বের অন্যতম সর্বাধিক সমাদৃত ও আলোকচিত্রিত স্থান। মানুষ ঘণ্টার পর ঘণ্টা লাইনে দাঁড়ান কয়েক মুহূর্তের দৃষ্টির জন্য।",
            "আর তারপর... বিজয়া দশমীর পর আলো নিভে যায়।\nবাঁশের বাঁধন আলগা করা হয়।\nরাস্তা আবার ফিরে পায় তার দৈনন্দিন ধুলোবালি।",
            "কলকাতার মণ্ডপ তাই কেবল কোনো ক্ষণস্থায়ী ছাউনি নয়।\nতারা ত্রিমাত্রিক স্মৃতি—যা ধ্বংস হয়েও মানুষের হৃদয়ে চিরকাল অমর হয়ে থাকে।"
          ]
        }
      ]
    }
  },

  // -------------------------------------------------------------
  // STORY 03: Arrival of the Goddess
  // -------------------------------------------------------------
  {
    id: 's3',
    num: '03',
    tagBn: 'ভক্তি ও আগমনী',
    tagEn: 'Devotion & Agomoni',
    titleBn: 'মায়ের আগমন ও বোধন',
    titleEn: 'Arrival of the Goddess',
    descBn: 'ভোরের সেই চণ্ডীপাঠের সুর থেকে ষষ্ঠীর সায়াহ্নে দেবীর বোধন — মহিষাসুরমর্দিনী এবং ঘরের মেয়ে উমার ঘরে ফেরার উপাখ্যান।',
    descEn: 'From the iconic dawn broadcast of Mahalaya to the sacred awakening on Shashthi — welcoming the warrior and the daughter.',
    accent: '#A62838',
    titleColor: 'text-[#5C0E1A]',
    cardBg: 'bg-gradient-to-b from-[#FFF6F7] via-[#FDF0F2] to-[#FCE2E5]',
    cardBorder: 'border-[#EAB8BE]',
    cardBorderHover: 'hover:border-[#A62838]',
    innerBorder: 'border-[#A62838]/20',
    badgeBg: 'bg-[#FDE4E8]',
    badgeBorder: 'border-[#EBA9B2]',
    watermarkColor: 'text-[#A62838]/10',
    flourishColor: '#A62838',
    btnBg: 'bg-[#A62838]',
    btnHoverBg: 'hover:bg-[#821826]',
    btnText: 'text-white',
    icon: <Flame className="w-4 h-4 text-[#A62838]" />,
    isReady: true,
    contentEn: {
      subtitle: 'From the Voice Before Dawn to the Awakening on Shashthi',
      sections: [
        {
          text: [
            "Durga does not arrive in Bengal all at once.",
            "She arrives first as a change in the air.\nThen as kash flowers beside roads and fields.\nThen in advertisements, new clothes and half-finished bamboo structures.\nThen, one morning before sunrise, she arrives as a voice.",
            "For generations of Bengalis, that morning has been Mahalaya."
          ]
        },
        {
          heading: "Before the Goddess comes, Bengal remembers its ancestors",
          text: [
            "Mahalaya has an important ritual identity beyond Durga Puja.",
            "It marks the conclusion of Pitri Paksha, the period associated with remembrance of departed ancestors, and the transition towards Devi Paksha. People traditionally gather beside rivers and other water bodies to perform tarpan, offering water in memory of their ancestors. Akashvani's reporting continues to document crowds visiting ghats for these rites on Mahalaya.",
            "So Mahalaya begins with remembrance before it becomes anticipation.\nThe past is honoured before the Goddess is welcomed."
          ]
        },
        {
          heading: "4 a.m. and a radio",
          text: [
            "Then comes one of Bengal's most extraordinary pieces of broadcast history: Mahishasuramardini.",
            "It combines Sanskrit recitation, narration, devotional music and the story of the Goddess who defeats Mahishasura. The voice most inseparably associated with it is that of Birendra Krishna Bhadra, whose Chandipath became part of the soundscape of Bengali autumn.",
            "You will often see 1931 presented online as an unquestionable “first broadcast” date. The archival history is slightly more complicated.",
            "Akashvani Kolkata's own recent institutional account says the programme has been broadcast on Mahalaya since 1932, while the name Mahishasurmardini was adopted in 1937. Other historical accounts describe an earlier composition or precursor in 1931. The difference appears to reflect the programme's evolution through its early versions rather than a simple one-day birth.",
            "That distinction is worth preserving.\nThe tradition is nearly a century old; we do not need to make its history tidier than the evidence allows."
          ]
        },
        {
          heading: "The eyes",
          text: [
            "Meanwhile, elsewhere in Kolkata, another symbolic arrival takes place.",
            "UNESCO's official description of Durga Puja identifies Mahalaya as the inaugural point in the festival cycle and highlights the painting of the Goddess's eyes—Chokkhudaan—as the image is brought towards ritual completion. UNESCO's photographic documentation specifically records Chokkhudaan at Kumartuli as the image-maker painting Durga's eyes.",
            "It is a breathtaking idea.",
            "The body has already emerged from straw and clay.\nThe face has been formed.\nColour has appeared.",
            "But the final gaze changes our relationship with the sculpture.\nA clay image now appears to look back."
          ]
        },
        {
          heading: "Important: Mahalaya and Bodhan are not the same ritual",
          text: [
            "Popular descriptions frequently say, “Durga Puja begins on Mahalaya,” and then say, “Durga Puja begins on Shashthi.”",
            "These statements refer to different layers of the festival.",
            "UNESCO treats Mahalaya as the opening of the broader ten-day cycle. In the traditional ritual sequence, however, Shashthi marks the formal preparation for the principal worship. Belur Math's detailed liturgical record lists Kalparambha, Bodhan, Amantran and Adhivas among the Shashthi rites.",
            "Bodhan literally means awakening.",
            "In the ritual tradition documented by Belur Math, the Goddess is awakened at dusk, associated with a bel or bilva tree/branch and a consecrated water vessel. Amantran then means invitation, while Adhivas involves invocation and sanctification before the worship of Saptami.",
            "So Mahalaya is the distant drumbeat of arrival.\nShashthi opens the door."
          ]
        },
        {
          heading: "Uma comes home",
          text: [
            "Bengal adds another emotional layer to the warrior Goddess.",
            "Durga is not only Mahishasuramardini, the destroyer of the buffalo demon. In Bengali imagination she is also Uma, the married daughter returning temporarily from Kailash to her parental home.",
            "Belur Math's account of Agamani songs explains this tradition through Uma's return to her parents Himavat and Menaka. The songs express Menaka's concern and affection for her married daughter and became part of Bengal's cultural welcome to the Goddess.",
            "This changes the emotional character of the festival.\nThe deity who arrives carrying weapons is also greeted like a daughter.",
            "Lakshmi, Saraswati, Kartik and Ganesha stand around her not merely as separate divinities in Bengali visual culture, but as part of a recognisable family tableau. Scholarship on Bengal's Durga tradition notes how strongly this domestic interpretation shaped the festival.",
            "That is why Agomoni can sound so intimate.\n\nIt is not simply:\n“The Goddess is coming.”\n\nIt is:\n“Our daughter is coming home.”"
          ]
        },
        {
          heading: "The city starts listening",
          text: [
            "By Shashthi, cloth coverings are removed from completed pandals.\nDhaks become louder.\nThe smell of incense appears at street corners.",
            "The Goddess who was clay in Kumartuli is now seated beneath lights.",
            "But perhaps her first arrival still happens much earlier—\nin a dark room, before sunrise,\nwhen an old radio voice begins the story again."
          ]
        }
      ]
    },
    contentBn: {
      subtitle: 'ভোরের সেই চণ্ডীপাঠের সুর থেকে ষষ্ঠীর সায়াহ্নে দেবীর বোধন',
      sections: [
        {
          text: [
            "দেবী দুর্গা কিন্তু বাংলায় হঠাৎ করে একদিনে আসেন না।",
            "তিনি প্রথমে আসেন বাতাসে এক অদ্ভুত হালকা গন্ধ নিয়ে।\nতারপর রাস্তার ধারে আর কাশফুলের দোলায় সাদা মেঘের মতো।\nতারপর পুজোর বিজ্ঞাপন, নতুন কাপড়ের গন্ধ আর গলির মোড়ে আধখানা বাঁশের কাঠামোর খটখট শব্দে।\nতারপর, এক ভোরে সূর্য ওঠার আগে, তিনি আসেন একটি গমগমে চেনা কণ্ঠস্বর হয়ে।",
            "প্রজন্মের পর প্রজন্ম বাঙালির কাছে সেই ভোরটিই হলো—মহালয়া।"
          ]
        },
        {
          heading: "দেবী আগমনের আগে পিতৃস্মরণ",
          text: [
            "দুর্গাপূজার মহোৎসবের বাইরেও মহালয়ার এক সুগভীর বৈদিক ও পারিবারিক তাৎপর্য রয়েছে।",
            "এই দিনটিতে পিতৃপক্ষের সমাপ্তি ঘটে এবং সূচনা হয় দেবীপক্ষের। প্রয়াত পূর্বপুরুষদের স্মরণে এদিন গঙ্গাসহ বিভিন্ন নদী ও জলাশয়ের ঘাটে মানুষ তর্পণ করেন—অঞ্জলি ভরে জল অর্পণ করে পূর্বসূরিদের শ্রদ্ধা নিবেদন করেন। আকাশবাণীর সংবাদে আজও সেই ব্রাহ্মমুহূর্তে ঘাটে ঘাটে মানুষের বাঁধভাঙা ভিড়ের জীবন্ত বিবরণ পাওয়া যায়।",
            "অর্থাৎ মহালয়া উদযাপনের আগে শুরু হয় স্মৃতিতর্পণে।\nদেবীকে আবাহনের আগে বাঙালি তার অতীত শিকড় ও পূর্বপুরুষদের প্রণাম জানায়।"
          ]
        },
        {
          heading: "ভোর চারটে এবং একটি রেডিয়ো",
          text: [
            "তারপর শুরু হয় বাঙালি সম্প্রচার ইতিহাসের সবচেয়ে জাদুকরি এক অধ্যায়: মহিষাসুরমর্দিনী।",
            "সংস্কৃত শ্লোকপাঠ, ওজস্বী ধারাভাষ্য, ভক্তিমূলক গান আর মহিষাসুরমর্দিনী চণ্ডীর সেই চিরন্তন আখ্যান। আর এর সাথে যে কণ্ঠটি অবিচ্ছেদ্যভাবে জড়িয়ে আছে, তিনি বীরেন্দ্রকৃষ্ণ ভদ্র—যার উদাত্ত চণ্ডীপাঠ বাঙালির শরতের নিজস্ব শব্দতরঙ্গে পরিণত হয়েছে।",
            "ইন্টারনেটে প্রায়ই ১৯৩১ সালকে এর প্রথম সম্প্রচারের বছর হিসেবে উল্লেখ করা হয়। তবে মহাফেজখানার দলিল ও ইতিহাস কিছুটা সূক্ষ্ম ও বিস্তারিত।",
            "আকাশবাণী কলকাতার নিজস্ব সাম্প্রতিক নথি অনুযায়ী, মহালয়ার ভোরে এই বিশেষ অনুষ্ঠানটি নিয়মিত সম্প্রচারিত হতে শুরু করে ১৯৩২ সাল থেকে, আর 'মহিষাসুরমর্দিনী' নামটি গৃহীত হয়েছিল ১৯৩৭ সালে। তবে ১৯৩১ সালে এর এক পূর্বসূরি বা খসড়া অনুষ্ঠান প্রচারিত হয়েছিল। এই পার্থক্যটি আসলে একটি কালজয়ী অনুষ্ঠানের ধাপে ধাপে বিবর্তনের সাক্ষ্য দেয়।",
            "এই ঐতিহ্যটি প্রায় এক শতক প্রাচীন; একে অহেতুক রূপকথার রঙ না দিয়ে তার ঐতিহাসিক বিবর্তনের সত্যকে তুলে ধরাই তার প্রতি শ্রেষ্ঠ সম্মান।"
          ]
        },
        {
          heading: "সেই অপার্থিব চোখ",
          text: [
            "একই সময়ে, কলকাতার আরেক প্রান্তে দেবীর আরেকটি প্রতীকী আগমন ঘটে।",
            "ইউনেস্কোর দুর্গাপূজার তালিকায় মহালয়াকে দশ দিনের উৎসব চক্রের উদ্বোধনী লগ্ন হিসেবে চিহ্নিত করা হয়েছে এবং বিশেষভাবে তুলে ধরা হয়েছে দেবীর চোখ আঁকার সেই পবিত্র ক্ষণ—চক্ষুদান। ইউনেস্কোর আলোকচিত্রে কুমোরটুলিতে প্রতিমাশিল্পীর তুলির টানে দুর্গার চোখ আঁকার দৃশ্যটিকে এই সংস্কৃতির অন্যতম শ্রেষ্ঠ প্রতীক বলে গণ্য করা হয়েছে।",
            "ভাবলে আজও রোমাঞ্চ হয়।",
            "খড় আর মাটির শরীর এতদিনে গড়ে উঠেছে।\nমুখমণ্ডলের আদল তৈরি হয়েছে।\nরঙের প্রলেপ পড়েছে।",
            "কিন্তু শেষ তুলির টানে আঁকা সেই চাহনি মাটির মূর্তির সাথে আমাদের সম্পর্কটাই রাতারাতি বদলে দেয়।\nএকটি মাটির প্রতিমা হঠাৎ জীবন্ত হয়ে ভক্তের চোখে চোখ রাখে।"
          ]
        },
        {
          heading: "স্মরণে রাখা দরকার: মহালয়া আর বোধন কিন্তু এক নয়",
          text: [
            "লোকমুখে প্রায়ই শোনা যায়, “মহালয়াতেই পুজো শুরু,” আবার পরক্ষণেই বলা হয়, “আসল পুজো শুরু তো ষষ্ঠীতে।”",
            "আসলে এই দুটি কথা উৎসবের দুটি ভিন্ন স্তরকে নির্দেশ করে।",
            "ইউনেস্কো মহালয়াকে পুরো দশ দিনের বৃহৎ সাংস্কৃতিক চক্রের সূচনা বলে গণ্য করে। কিন্তু শাস্ত্রীয় ও পূজাপদ্ধতি অনুসারে ষষ্ঠী তিথি হলো মূল পূজার আনুষ্ঠানিক প্রস্তুতি। বেলুড় মঠের পূজাক্রম নথিতে ষষ্ঠীর দিন কল্পারম্ভ, বোধন, আমন্ত্রণ ও অধিবাসের মতো সুনির্দিষ্ট ধর্মীয় আচারের কথা উল্লেখ রয়েছে।",
            "'বোধন' শব্দের আক্ষরিক অর্থই হলো জাগরণ বা ঘুম ভাঙানো।",
            "পৌরাণিক বিশ্বাস ও বেলুড় মঠের নির্দেশিত রীতি অনুযায়ী, রামচন্দ্র শরৎকালে রাবণ বধের উদ্দেশ্যে দেবীর অকালবোধন করেছিলেন। সন্ধ্যায় বিল্ববৃক্ষ বা বেলগাছের তলে ঘট স্থাপন করে দেবীকে জাগ্রত করা হয়। এরপর 'আমন্ত্রণ' মানে তাঁকে সপরিবারে মণ্ডপে নিমন্ত্রণ এবং 'অধিবাস' মানে সপ্তমী পূজার আগে পবিত্রকরণ।",
            "অর্থাৎ মহালয়া হলো দেবীর দূর থেকে ভেসে আসা আগমনী বার্তা।\nআর ষষ্ঠী হলো গৃহের দ্বার উন্মোচনের ক্ষণ।"
          ]
        },
        {
          heading: "উমা ফিরছে বাপের বাড়ি",
          text: [
            "বাঙালি তার রণরঙ্গিনী দেবীর ওপর আরেকটি অত্যন্ত কোমল ও পারিবারিক আবেগের প্রলেপ দিয়েছে।",
            "দুর্গা কেবল মহিষাসুরমর্দিনী নন, তিনি বঙ্গসন্তানের কাছে ঘরের আদরের মেয়ে 'উমা'—যিনি কৈলাস থেকে মাত্র চার দিনের জন্য বাপের বাড়িতে বেড়াতে এসেছেন।",
            "বেলুড় মঠের আগমনী গানের বিবরণে হিমালয় ও মেনকার কন্যা উমার ঘরে ফেরার সেই বাৎসল্য রসের অপূর্ব ব্যাখ্যা পাওয়া যায়। মেনকার সেই ব্যাকুল প্রতীক্ষা আর দীর্ঘ এক বছর পর মেয়েকে কাছে পাওয়ার আকুতি যেন বাংলার প্রতিটি মায়ের মনের প্রতিচ্ছবি।",
            "এই পারিবারিক ভাবনাই উৎসবটির চরিত্রকে বাকি দুনিয়া থেকে আলাদা করে তুলেছে।\nঅস্ত্র হাতে যে দেবী অসুর বধ করতে এসেছেন, বাঙালি তাঁকেই আপন কন্যার মতো পরম আদরে বরণ করে নেয়।",
            "তাই লক্ষ্মী, সরস্বতী, কার্তিক আর গণেশ এখানে কেবল কোনো দূরবর্তী দেব-দেবী নন; তাঁরা উমার সন্তান, এক চেনা বাঙালি পরিবারের স্নেহঘন রূপ।",
            "সেই কারণেই আগমনীর সুর এত হৃদয়স্পর্শী।\n\nএটি কেবল কোনো সাধারণ ঘোষণা নয় যে:\n“দেবী আসছেন।”\n\nএটি হলো অন্তরের গভীর থেকে ওঠা কান্নাভেজা আনন্দ:\n“আমাদের মেয়ে ঘরে ফিরছে।”"
          ]
        },
        {
          heading: "শহর এবার কান পেতে শোনে",
          text: [
            "ষষ্ঠীর সন্ধ্যায় মণ্ডপের ওপর থেকে চটের পর্দা সরে যায়।\nঢাকের কাঠি দ্রিম দ্রিম বোলে মুখরিত করে চারপাশ।\nগলির মোড়ে মোড়ে ধুনোর সুবাস ছড়িয়ে পড়ে।",
            "কুমোরটুলির যে দেবী এতদিন মাটির তাল ছিলেন, তিনি এখন আলোকোজ্জ্বল বেদিতে রাজরাজেশ্বরী।",
            "কিন্তু দেবীর সেই আদি আগমন হয়তো ঘটেছিল আরও অনেক আগে—\nসূর্যোদয়ের আগে এক অন্ধকার ঘরে,\nযখন সেই পুরনো রেডিওর কণ্ঠস্বর নতুন করে শুনিয়েছিল সেই রূপকথা।"
          ]
        }
      ]
    }
  },

  // -------------------------------------------------------------
  // STORY 04: Artisans of Kumartuli
  // -------------------------------------------------------------
  {
    id: 's4',
    num: '04',
    tagBn: 'মৃৎশিল্প',
    tagEn: 'Clay Artistry',
    titleBn: 'কুমোরটুলির রূপকার',
    titleEn: 'Artisans of Kumartuli',
    descBn: 'আলোর রোশনাইয়ের নিচে দেবী রূপ পাওয়ার আগে মাটির সাথে লড়াই — খড়, বাঁশ আর গঙ্গামাটি দিয়ে প্রাণ প্রতিষ্ঠার অজানা কাহিনী।',
    descEn: 'Before Kolkata sees the Goddess, someone must build her from earth — the untold lives and techniques of Kumartuli’s sculptors.',
    accent: '#6E472D',
    titleColor: 'text-[#422716]',
    cardBg: 'bg-gradient-to-b from-[#FDF9F5] via-[#F8F1EA] to-[#EFE2D6]',
    cardBorder: 'border-[#D9C0AD]',
    cardBorderHover: 'hover:border-[#6E472D]',
    innerBorder: 'border-[#6E472D]/20',
    badgeBg: 'bg-[#F4E6DC]',
    badgeBorder: 'border-[#D1B5A3]',
    watermarkColor: 'text-[#6E472D]/10',
    flourishColor: '#6E472D',
    btnBg: 'bg-[#6E472D]',
    btnHoverBg: 'hover:bg-[#52321E]',
    btnText: 'text-white',
    icon: <Palette className="w-4 h-4 text-[#6E472D]" />,
    isReady: true,
    contentEn: {
      subtitle: 'Before Kolkata Sees the Goddess, Someone Must Build Her from Earth',
      sections: [
        {
          text: [
            "Months before anyone begins pandal-hopping, Durga stands silently in a narrow north Kolkata lane.",
            "She has no eyes.\nNo jewellery.\nPerhaps no fingers.\nSometimes she does not yet have skin—only bamboo and straw.",
            "This is Kumartuli, one of the city's most famous artisan quarters and one of the principal places where Kolkata's Gods acquire physical form."
          ]
        },
        {
          heading: "A neighbourhood named after its makers",
          text: [
            "Kumor means potter. Sahapedia explains tuli as a term connected with a compact locality or quarter. Kumartuli therefore developed its identity quite literally around the community of potters who lived and worked there.",
            "Its history is tied to the growth of eighteenth-century Kolkata and to the movement of skilled clay workers from Krishnanagar and other parts of Nadia.",
            "A widely repeated historical account connects the expansion of Kolkata's idol-making community with the rise of wealthy household Pujas in north Kolkata during the eighteenth century. Sahapedia traces settlement by craftsmen from the Krishnanagar tradition into the riverside quarter that became Kumartuli.",
            "It is safer, however, to treat that as the broad history of the cluster rather than claim that one king, one Puja or one specific year single-handedly “created” Kumartuli. Kolkata's artisan neighbourhood developed over time through migration, patronage and growing demand.",
            "By the twentieth century, community Pujas dramatically expanded that demand. Every new neighbourhood Puja required another Durga.\nPublic worship changed the lives of the people who manufactured divinity."
          ]
        },
        {
          heading: "First, a skeleton",
          text: [
            "A finished Durga may appear graceful and effortless.\nHer construction is anything but.",
            "The process begins with a supporting framework of bamboo or wood. Bundles of straw are tied onto this structure, gradually establishing the mass of the torso, legs and limbs.",
            "At this stage she looks almost anatomical.\nNo smooth surface hides the engineering.\nNo paint hides the rope.\nThe artist is solving problems of balance, proportion and weight before sculpting a face.",
            "Sahapedia and field reporting from Kumartuli both document bamboo-and-straw frameworks as the basis on which clay is progressively applied."
          ]
        },
        {
          heading: "Not all mud is the same",
          text: [
            "Then comes clay.",
            "This is another area where simplified tourist descriptions can become misleading. UNESCO summarises Kolkata's tradition as sculpting images from unfired riverine clay, closely linking the material cycle to the Ganga and eventual immersion.",
            "Detailed artisan documentation shows a more technical process.",
            "Sahapedia records two kinds of clay used for different stages: entel mati, a sticky clay, and bele mati, a different-textured clay used in finishing. The first may be mixed with rice husk and applied over the straw body; subsequent finer layers smooth and define the form. The workshop documented by Sahapedia sourced suitable clay from the Uluberia area because of its properties.",
            "In other words, “Ganga clay” is culturally meaningful shorthand, but the actual craft is governed by practical knowledge of soil texture, binding, cracking and drying.",
            "An artisan does not simply need earth.\nAn artisan needs the right earth for the right layer."
          ]
        },
        {
          heading: "Layer by layer",
          text: [
            "The rough layer establishes the body.\nIt dries.\nAnother layer refines it.\nIt dries again.\nCracks are repaired.",
            "Faces, hands and fingers may be prepared separately and attached. Moulds allow workshops dealing with large numbers of commissions to reproduce certain parts efficiently, while the final finish and expression require individual work.",
            "Then comes colour.\nWhat was brown earth becomes skin.\nHair acquires depth.\nThe lion gains teeth.\nMahishasura gains expression.\nThe workshop changes character almost overnight."
          ]
        },
        {
          heading: "And finally, the gaze",
          text: [
            "Some workers specialise in particular stages. Sahapedia records that certain craftspeople concentrate on tasks such as colouring, making hands or painting the eyes—Chokkhudaan.",
            "UNESCO chose that moment for its official Durga Puja documentation too: an image-maker at Kumartuli painting Durga's eyes as an act that symbolically brings the clay image to life.",
            "For a visitor, the eyes may take seconds to notice.\nFor the maker, they can determine the entire expression.",
            "Too soft and the warrior disappears.\nToo fierce and the mother disappears.\nDurga must somehow contain both."
          ]
        },
        {
          heading: "One Goddess, several visual languages",
          text: [
            "Traditional Durga images can use an ek-chala composition, where the divine family is visually united within a common frame or backdrop. Contemporary commissions may separate figures or radically reinterpret costume, ornament and presentation.",
            "Decoration itself has its own vocabulary.",
            "Sholapith can create delicate white ornamentation. Daker saaj developed as a distinctive decorative style using shimmering foil and ornament. The chaalchitra can provide a painted narrative backdrop.",
            "So the idol is not merely sculpture.\nIt is sculpture joined with painting, ornament, mythology and theatre."
          ]
        },
        {
          heading: "Kumartuli is not only men's work",
          text: [
            "A persistent stereotype says the Goddess is always made by men.",
            "Historically, the profession has indeed been overwhelmingly male—but women have fought their way into it.",
            "Artists such as China Pal, Mala Pal, Kakoli Pal and Namita Pal have been documented working as professional idol-makers despite longstanding gender barriers. In 2023, a former office-bearer of the Kumartuli Mritshilpi Sanskritik Samiti told The Indian Express that only roughly 20–25 of nearly 400 idol-makers were women at that time.",
            "Earlier government tourism material also described women artisans as a small minority within the neighbourhood.",
            "The exact headcount changes with year and definition, but the conclusion is clear: women remain underrepresented, although their presence is now firmly part of Kumartuli's story."
          ]
        },
        {
          heading: "A neighbourhood connected to the world",
          text: [
            "Kumartuli's Durga no longer belongs only to Kolkata.",
            "Sahapedia documents idols travelling to Bengali communities abroad, while the West Bengal creative-economy study describes Kumartuli as an idol-making brand serving markets across India and internationally.",
            "Some overseas commissions require smaller or even specially constructed forms that can survive shipping and fit foreign venues.",
            "The Goddess changes dimensions.\nThe craftsmanship travels.\nThe tradition remains recognisable."
          ]
        },
        {
          heading: "Thousands of invisible hands",
          text: [
            "Even estimating Kumartuli's workforce is difficult because studies count different categories.",
            "The 2019 creative-economy report estimated roughly 500 artisans and about 3,000 skilled and unskilled workers linked to the cluster during its production ecosystem. Later association-based reporting referred to nearly 400 idol-makers specifically. These figures should not be treated as contradictory headcounts because they refer to different years and categories of labour.",
            "And that distinction matters.",
            "Behind one famous sculptor may stand clay preparers, straw workers, painters, ornament makers, assistants, porters and temporary migrant labourers.",
            "When you finally see Durga under perfect pandal lighting, most of those people will not be standing beside her.\nBut their fingerprints are everywhere.",
            "Then comes Dashami.\nThe image that took weeks or months to create is carried away for immersion.\nThe clay returns to water.\nAnd the artisans return to their workshops.",
            "Soon another bamboo frame will rise.\nBecause in Kumartuli, the end of one Goddess is already the beginning of the next."
          ]
        }
      ]
    },
    contentBn: {
      subtitle: 'কলকাতার দর্শনে দেবী আসার আগে, মাটির বুক থেকে তাঁকে সৃষ্টি করার নেপথ্য কাহিনী',
      sections: [
        {
          text: [
            "শহর যখন প্যান্ডেল হপিংয়ের স্বপ্নে বিভোর হওয়ার বহু আগে, উত্তর কলকাতার এক চিলতে সরু গলিতে নিঃশব্দে দাঁড়িয়ে থাকেন দুর্গা।",
            "তাঁর তখনও চোখ ফোটেনি।\nগায়ে নেই কোনো গহনা।\nহয়তো হাতের আঙুলগুলোও তখনও তৈরি হয়নি।\nকখনও কখনও তাঁর চামড়াও বসেনি—কেবল বাঁশের চ্যাটাই আর শুকনো খড়ের এক নিঃশব্দ কঙ্কাল।",
            "এটাই কুমোরটুলি—শহরের সবচেয়ে প্রাচীন ও কিংবদন্তি মৃৎশিল্পী পাড়া, যেখানে কলকাতার দেবতারা মাটির রূপ ধারণ করে মর্ত্যে নামেন।"
          ]
        },
        {
          heading: "শিল্পীদের নামে নামাঙ্কিত এক জনপদ",
          text: [
            "'কুমোর' মানে যিনি মাটির পাত্র বা প্রতিমা গড়েন। আর সাহাপিডিয়ার বিশ্লেষণ অনুযায়ী, 'টুলি' শব্দের অর্থ একটি বিশেষ পাড়া বা এলাকা। অর্থাৎ কুমোরটুলির আত্মপরিচয়টি আক্ষরিক অর্থেই গড়ে উঠেছিল সেখানে বসবাসকারী মৃৎশিল্পীদের কেন্দ্র করে।",
            "এর ইতিহাস জড়িয়ে আছে আঠারো শতকের কলকাতার বিকাশ এবং নদিয়ার কৃষ্ণনগর থেকে দক্ষ মৃৎশিল্পীদের এই গঙ্গার তীরে পাড়ি জমানোর ঐতিহ্যের সাথে।",
            "ইতিহাসের এক বহুল প্রচলিত বিবরণে বলা হয়, উত্তর কলকাতার ধনী পরিবারের বনেদি পুজোর প্রতিমা গড়ার প্রয়োজনেই কৃষ্ণনগরের শিল্পীরা গঙ্গার তীরের এই অঞ্চলে বসতি স্থাপন করেছিলেন।",
            "তবে কোনো একক রাজা বা একটিমাত্র পুজো কুমোরটুলির জন্ম দিয়েছে বলার চেয়ে এটি বলাই শ্রেয় যে, গঙ্গার সান্নিধ্য, জলপথে কাঁচামাল পরিবহনের সুবিধা এবং উত্তর কলকাতার বিত্তবানদের পৃষ্ঠপোষকতা মিলেই ধীরে ধীরে এই শিল্পপল্লী গড়ে উঠেছে।",
            "বিশ শতকে সর্বজনীন পুজোর বিস্ফোরণ এই চাহিদাকে আকাশছোঁয়া করে তোলে। প্রতিটি নতুন পাড়ার জন্য প্রয়োজন হয়ে পড়ল আরেকটি করে প্রতিমা।\nগণমানুষের পুজো যারা ঈশ্বর তৈরি করেন, সেই নেপথ্য কারিগরদের জীবন ও রুটি-রুজিকে আমূল বদলে দিল।"
          ]
        },
        {
          heading: "প্রথমে একটি কঙ্কাল",
          text: [
            "মণ্ডপে দাঁড়ানো একটি পূর্ণাঙ্গ দুর্গাপ্রতিমাকে দেখলে মনে হয় কত সাবলীল ও অনায়াস তার ভঙ্গি।\nকিন্তু তার নির্মাণপ্রক্রিয়াটি চরম বিজ্ঞান ও শ্রমের এক মহাকাব্য।",
            "কাজ শুরু হয় বাঁশ আর কাঠের কাঠামোর ওপর। তার ওপর খড়ের আঁটি শক্ত করে সুতলি দড়ি দিয়ে বেঁধে ধীরে ধীরে গড়ে তোলা হয় দেবীর বুক, কোমর, পা ও দশটি হাতের প্রাথমিক পেশিবহুল গঠন।",
            "এই পর্যায়ে তাঁকে দেখলে এক শারীরস্থানিক মানচিত্র বলে মনে হয়।\nকোনো মসৃণ মাটি এই ইঞ্জিনিয়ারিংকে ঢেকে রাখে না।\nকোনো রঙ ঢাকতে পারে না সেই দড়ির বাঁধন।\nমুখ গড়ার আগে শিল্পীকে সমাধান করতে হয় ভারসাম্য, ওজন বণ্টন ও ভরকেন্দ্রের জটিল সমীকরণ।",
            "সাহাপিডিয়া ও বিভিন্ন ফিল্ড স্টাডিতে দেখা গেছে, এই বাঁশ ও খড়ের কাঠামোই হলো সেই ভিত্তি, যার ওপর ধাপে ধাপে মাটির প্রলেপ বসে।"
          ]
        },
        {
          heading: "সব মাটির গুণ এক নয়",
          text: [
            "এরপর আসে মাটি।",
            "সাধারণ পর্যটকদের লেখায় প্রায়ই বলা হয় 'গঙ্গামাটি দিয়ে তৈরি ঠাকুর'। কিন্তু প্রকৃত কারুশিল্পের বাস্তবতা অনেক বেশি গভীর ও বৈজ্ঞানিক।",
            "প্রতিমা তৈরিতে মূলত দুই ধরনের মাটি ব্যবহৃত হয়: প্রথমটি এঁটেল মাটি, যা অত্যন্ত আঠালো; এবং দ্বিতীয়টি বেলে মাটি, যা ফিনিশিং বা সূক্ষ্ম রূপদানে অপরিহার্য। উলুবেড়িয়া এবং গঙ্গার বিশেষ চড়া থেকে আনা এই এঁটেল মাটির সাথে ধানের তুষ বা কুঁড়ো মিশিয়ে খড়ের কাঠামোর ওপর প্রথম পুরু প্রলেপ দেওয়া হয়। এরপর শুকিয়ে এলে বেলে মাটির পাতলা আস্তরণে অঙ্গপ্রত্যঙ্গের সূক্ষ্ম ভাঁজ নিখুঁত করা হয়।",
            "অর্থাৎ 'গঙ্গামাটি' কেবল একটি সাংস্কৃতিক ও ধর্মীয় প্রতীক নয়; এর পেছনে রয়েছে মাটির আঠালো ভাব, ফাটল ধরার চরিত্র এবং শুকানোর সময় নিয়ে বংশপরম্পরায় অর্জিত বৈজ্ঞানিক জ্ঞান।",
            "শিল্পীর কেবল মাটির দরকার হয় না।\nকোন স্তরে কোন মাটির প্রয়োজন, তা জানার জন্য শিল্পীর আঙুলে থাকতে হয় আজন্ম অভিজ্ঞতা।"
          ]
        },
        {
          heading: "স্তরে স্তরে রূপবদল",
          text: [
            "প্রথম খসখসে স্তরটি শরীরের মূল আকার দেয়।\nতা রোদে শুকায়।\nপরের মিহি স্তরটি তাকে কমনীয় রূপ দেয়।\nতা আবার শুকায়।\nযেখানে ফাটল ধরে, সেখানে ন্যাকড়া আর মাটির প্রলেপ দিয়ে সারিয়ে তোলা হয়।",
            "মুখ, হাত এবং আঙুলগুলো অনেক সময় ছাঁচে ফেলে আলাদা তৈরি করে জোড়া লাগানো হয়। যে কর্মশালাগুলোতে বহু প্রতিমার বায়না থাকে, সেখানে ছাঁচ দ্রুত কাজ করতে সাহায্য করে, কিন্তু প্রতিমার শেষ অভিব্যক্তি ফুটিয়ে তুলতে লাগে শিল্পীর নিজস্ব হাতের জাদু।",
            "এরপর আসে রঙের পালা।\nধূসর মাটির শরীর হয়ে ওঠে উজ্জ্বল তপ্তকাঞ্চন বর্ণ।\nচুলে আসে কালো ঢেউ।\nসিংহের দাঁত ধারালো রূপ পায়।\nমহিষাসুরের মুখে ফোটে রাগ ও পরাভবের অভিব্যক্তি।\nগোটা কর্মশালার চেহারা রাতারাতি বদলে যায়।"
          ]
        },
        {
          heading: "এবং সবশেষে... সেই মহাজাগতিক চাহনি",
          text: [
            "মৃৎশিল্পীদের মধ্যে অনেকেই নির্দিষ্ট কাজে সিদ্ধহস্ত। কেউ শুধু কাঠামো বাঁধেন, কেউ প্রতিমায় গায়ের রঙ দেন, আবার কেউ কেবল চোখ আঁকেন—যাকে বলা হয় 'চক্ষুদান'।",
            "ইউনেস্কোও তাদের দলিলে এই বিশেষ মুহূর্তটিকে স্থান দিয়েছে: মহালয়ার পুণ্যলগ্নে শিল্পীর তুলির আঁচড়ে দেবীর ত্রিনয়ন প্রস্ফুটিত হওয়ার সেই মাহেন্দ্রক্ষণ।",
            "একজন দর্শকের চোখে সেই দৃষ্টি হয়তো ক্ষণিকের বিস্ময়।\nকিন্তু রূপকারের কাছে এই চোখের টানেই নির্ভর করে প্রতিমার সমগ্র ব্যক্তিত্ব।",
            "চোখ যদি বেশি শান্ত হয়, তবে রণরঙ্গিনী চণ্ডীর তেজ হারিয়ে যায়।\nআর যদি বেশি উগ্র হয়, তবে স্নেহের মা হারিয়ে যান।\nদুর্গার চাহনিতে এই দুই চরম ভাবের অবিশ্বাস্য মিলন ঘটাতে হয় শিল্পীকে।"
          ]
        },
        {
          heading: "এক দেবী, রূপের কত বাহার",
          text: [
            "ঐতিহ্যবাহী প্রতিমায় দেখা যায় 'একচালা'র রূপ—যেখানে একই চালচিত্রের নিচে দুর্গা, লক্ষ্মী, সরস্বতী, কার্তিক ও গণেশ এক অখণ্ড পরিবার হিসেবে বিরাজ করেন। আবার আধুনিক সর্বজনীন পুজোয় দেখা যায় আলাদা আলাদা প্রতিমা কিংবা চিরাচরিত রূপের আধুনিক শৈল্পিক পুনর্নির্মাণ।",
            "সজ্জার ক্ষেত্রেও রয়েছে নিজস্ব বৈচিত্র্য।\nশোলার সাজে থাকে নিখুঁত সাদা ফুলের সূক্ষ্মতা।\nডাকের সাজে থাকে রুপোলি ও সোনালি রাংতার জমকালো দ্যুতি।\nআর চালচিত্রে থাকে পটুয়াদের আঁকা পৌরাণিক ক্যানভাস।",
            "তাই প্রতিমা কেবল ভাস্কর্য নয়; এটি ভাস্কর্য, চিত্রশিল্প, ধাতুশিল্প আর লোকপুরাণের এক মহামিলন।"
          ]
        },
        {
          heading: "কুমোরটুলি কেবল পুরুষদের একচেটিয়া নয়",
          text: [
            "সমাজে প্রচলিত এক বদ্ধমূল ধারণা হলো প্রতিমা কেবল পুরুষরাই বানান।",
            "ঐতিহাসিকভাবে এই পেশায় পুরুষদের আধিপত্য থাকলেও, নারীরা লড়াই করে নিজেদের জায়গা করে নিয়েছেন।",
            "চায়না পাল, মালা পাল, কাকলি পাল ও নমিতা পালের মতো নারী মৃৎশিল্পীরা সমাজের সমস্ত রক্ষণশীল চোখরাঙানি উপেক্ষা করে সফল প্রতিমাশিল্পী হিসেবে নিজেদের প্রতিষ্ঠিত করেছেন। ২০২৩ সালে কুমোরটুলি মৃৎশিল্পী সাংস্কৃতিক সমিতির হিসাব অনুযায়ী, প্রায় ৪০০ প্রতিমাশিল্পীর মধ্যে ২০-২৫ জন ছিলেন নারী।",
            "সংখ্যাটি হয়তো এখনও কম, কিন্তু এই নারীদের উপস্থিতি কুমোরটুলির ইতিহাসের এক গর্বিত ও অনুপ্রেরণাদায়ী অধ্যায়।"
          ]
        },
        {
          heading: "বিশ্বের মানচিত্রে কুমোরটুলির পদচিহ্ন",
          text: [
            "কুমোরটুলির দুর্গা আজ আর শুধু কলকাতার অলিগলিতে সীমাবদ্ধ নেই।",
            "মার্কিন যুক্তরাষ্ট্র, যুক্তরাজ্য, কানাডা, জার্মানি কিংবা সিঙ্গাপুরের প্রবাসী বাঙালিদের পুজোয় পাড়ি জমায় কুমোরটুলির প্রতিমা। বিমানে সহজে ও নিরাপদে পাঠানোর জন্য শিল্পীরা ফাইবারগ্লাস কিংবা হালকা উপাদানে বিশেষ প্রতিমা তৈরি করেন।",
            "প্রতিমার পরিধি বদলায়।\nশিল্পী বদলে দেন মাধ্যমের চরিত্র।\nকিন্তু মাটির সেই অপার্থিব টান বিশ্বজুড়ে অক্ষুণ্ণ থাকে।"
          ]
        },
        {
          heading: "হাজারো অদৃশ্য হাতের ছোঁয়া",
          text: [
            "২০১৯ সালের সৃজনশীল অর্থনীতি সমীক্ষা অনুসারে, এই চত্বরে প্রায় ৫০০ প্রধান শিল্পী এবং তাঁদের সহযোগী হিসেবে প্রায় ৩,০০০ দক্ষ ও অদক্ষ শ্রমিক কাজ করেন।",
            "এই তথ্যটি অত্যন্ত গুরুত্বপূর্ণ।",
            "একজন নামজাদা ভাস্করের পেছনে দাঁড়িয়ে থাকেন নাম-না-জানা বহু মানুষ—মাটি ছানার কারিগর, খড় বাঁধার সহায়ক, রঙ প্রস্তুতকারক, গহনা সাজানোর মানুষ, কুলিমজুর এবং দূর দূরান্ত থেকে আসা মৌসুমি শ্রমিকেরা।",
            "আলোর রোশনাইয়ের নিচে যখন মণ্ডপে দেবীকে দর্শনার্থীরা প্রণাম করেন, তখন এই মানুষদের কেউই হয়তো সামনে থাকেন না।\nকিন্তু প্রতিমার প্রতি ইঞ্চিতে জড়িয়ে থাকে তাঁদের নিঃশব্দ হাতের ছাপ।",
            "বিজয়া দশমীতে এই প্রতিমা আবার ফিরে যায় গঙ্গাবক্ষে।\nমাটি আবার জলে মিশে একাকার হয়।\nআর শিল্পীরা ফিরে আসেন তাঁদের অন্ধকার কর্মশালায়।",
            "কারণ কুমোরটুলিতে, একটি প্রতিমার সমাপ্তি আসলে পরবর্তী প্রতিমার সূচনা।"
          ]
        }
      ]
    }
  },

  // -------------------------------------------------------------
  // STORY 05: Nostalgia of Bijoya
  // -------------------------------------------------------------
  {
    id: 's5',
    num: '05',
    tagBn: 'বিজয়া ও স্মৃতি',
    tagEn: 'Bijoya & Farewell',
    titleBn: 'বিজয়ার বিষাদ ও স্মৃতি',
    titleEn: 'Nostalgia of Bijoya',
    descBn: 'পুজো শেষের মিষ্টি বিষাদ, বরণ ও সিঁদুর খেলা — চোখের জলে বিদায় জানিয়ে ‘আসছে বছর আবার হবে’র চিরন্তন প্রতিশ্রুতি।',
    descEn: 'The day Bengal says goodbye without really saying goodbye — sindoor khela, immersion rites, and the sweet embrace of Shubho Bijoya.',
    accent: '#8C2344',
    titleColor: 'text-[#540D23]',
    cardBg: 'bg-gradient-to-b from-[#FDF5F8] via-[#FBF0F4] to-[#F7DEEB]',
    cardBorder: 'border-[#E4B8D0]',
    cardBorderHover: 'hover:border-[#8C2344]',
    innerBorder: 'border-[#8C2344]/20',
    badgeBg: 'bg-[#F8DEEC]',
    badgeBorder: 'border-[#E1A5C4]',
    watermarkColor: 'text-[#8C2344]/10',
    flourishColor: '#8C2344',
    btnBg: 'bg-[#8C2344]',
    btnHoverBg: 'hover:bg-[#6B1430]',
    btnText: 'text-white',
    icon: <Hourglass className="w-4 h-4 text-[#8C2344]" />,
    isReady: true,
    contentEn: {
      subtitle: 'The Day Bengal Says Goodbye Without Really Saying Goodbye',
      sections: [
        {
          text: [
            "On Shashthi, everyone says she has arrived.\nBy Saptami, the city belongs to her.\nAshtami feels endless.\nNavami arrives far too quickly.",
            "And then comes Dashami—the strange morning when celebration continues even though everyone knows the departure has begun.",
            "This is Bijoya."
          ]
        },
        {
          heading: "Durga is victorious—but Bengal sees a daughter leaving",
          text: [
            "Vijaya carries the idea of victory, and Dashami is the tenth day.\nYet Bengali emotional tradition gives the day another story.",
            "Durga is Uma, the daughter who has spent a few days at her parental home and must now return to Shiva's abode.",
            "This domestic interpretation is not a recent sentimental invention. A remarkable Calcutta lithograph dated 1878–83, now held by the Metropolitan Museum of Art, is titled Bijaya. It depicts Shiva arriving to take Durga away while members of her parental household participate in a tearful farewell. The museum notes that the separation of the married daughter from her family was a favoured theme in Bengali cultural imagination.",
            "More than a century ago, artists were already depicting the emotion Bengalis still recognise on Dashami.",
            "The Goddess wins her cosmic battle.\nThe family still cries when the daughter leaves.\nBoth feelings exist at once."
          ]
        },
        {
          heading: "Boron: preparing her to leave",
          text: [
            "Before immersion, many Bengali Puja traditions perform Devi Boron.",
            "Women offer farewell rituals to Durga, commonly including sweets, betel leaf and auspicious items, treating the Goddess as a married daughter about to depart for her husband's home.",
            "Different households and Puja committees preserve different procedures, so there is no single sequence followed identically everywhere.",
            "Some traditional family Pujas also perform Darpan Visarjan, a symbolic immersion involving the Goddess's reflection before the physical image is carried to water. Such family-specific practices remind us that “the Bengali Durga Puja ritual” is actually a family of traditions rather than one rigid script."
          ]
        },
        {
          heading: "Then the white-and-red crowd becomes redder",
          text: [
            "After Boron comes one of Dashami's most recognisable public images: Sindoor Khela.",
            "Traditionally, married Bengali Hindu women place vermilion on the Goddess and then smear sindoor on one another. Because sindoor is conventionally associated with married status, the ritual historically centred married women.",
            "But here's an important correction to a common internet “fact”:\nThere is no securely established historical date for the origin of Sindoor Khela.",
            "Claims that it is exactly “400 years old,” began in one named zamindar household, or originated in one precisely dated event are frequently repeated without adequate historical evidence. The Indian Express, in its account of Dashami rituals, explicitly notes that the origin of the practice is unknown.",
            "In recent years, some celebrations have also made Sindoor Khela more inclusive, with unmarried women, widows and others participating. That is a modern social development, not evidence that the historical practice always operated that way."
          ]
        },
        {
          heading: "The Goddess moves for the final time",
          text: [
            "Eventually the idol must leave the pandal.\nThe same face people crossed the city to see is lifted from its temporary home.\nDhaks play.\nCrowds move.\nThe journey turns towards water.",
            "UNESCO describes immersion on the tenth day as the conclusion of Durga Puja's ritual cycle: images made from unfired clay are returned to the river, linking the end of the festival to the material from which the Goddess was formed.",
            "There is something almost perfect in that cycle:\n\nEarth becomes body.\nBody becomes Goddess.\nGoddess becomes memory.\nBody returns to earth.",
            "The artwork disappears, but the tradition survives precisely because it will be made again."
          ]
        },
        {
          heading: "“Aaschhe bochhor abar hobe”",
          text: [
            "At immersion processions, the sadness is rarely silent.\nThe farewell carries a promise:\n\nআসছে বছর আবার হবে\nAaschhe bochhor abar hobe —\nNext year, it will happen again.",
            "That line explains something essential about Bijoya.\nThe departure is real, but never final.\nDurga leaves with an appointment to return."
          ]
        },
        {
          heading: "And then Bijoya changes direction",
          text: [
            "Once the Goddess has departed, attention turns from deity to people.",
            "Traditional Bengali Bijoya customs include younger people offering pranam to elders and receiving blessings, contemporaries embracing one another, visiting relatives and exchanging sweets. An academic study of Durga Puja records precisely this post-immersion pattern—sweets, embraces, respectful greetings and Bijoya messages continuing after the formal worship has ended.",
            "That means Bijoya is not simply the final scene of Puja.\nIt is the beginning of a social ritual.",
            "Someone knocks at a relative's door.\nA box of sweets is opened.\nAn elder places a hand on a younger person's head.\nFriends who did not meet during the crowded Puja days finally sit together.",
            "“Shubho Bijoya” travels from house to house.\nThe public carnival becomes private affection."
          ]
        },
        {
          heading: "Perhaps that is why Dashami hurts",
          text: [
            "The pandal that looked permanent for four nights suddenly looks temporary.\nThe queue disappears.\nLights are switched off.\nDecorations begin to come down.\nPeople who complained about the crowds two days earlier suddenly miss them.",
            "And somewhere in Kumartuli, artisans are already thinking about another year.",
            "This is the contradiction at the heart of Bijoya:\nwe celebrate victory while mourning departure.\nWe immerse something we spent months creating.\nWe say goodbye while promising another meeting.",
            "And that is why the final image of Durga Puja is not really the idol disappearing into water.\n\nIt is a city turning away from the river and saying—\n\nShubho Bijoya.\nCome home safely.\nCome home again."
          ]
        }
      ]
    },
    contentBn: {
      subtitle: 'যেদিন বাংলা বিদায় জানায়, তবু সত্যি করে বিদায় বলতে পারে না',
      sections: [
        {
          text: [
            "ষষ্ঠীতে সবাই বলে, মা এলেন।\nসপ্তমীতে আস্ত শহরটা হয়ে ওঠে তাঁর নিজের।\nঅষ্টমীর সন্ধিপুজোর রাত যেন কিছুতেই শেষ হতে চায় না।\nনবমী কেটে যায় এক পলকে, বড় তাড়াহুড়োয়।",
            "আর তারপর আসে দশমী—এক অদ্ভুত দ্বিধাদ্বন্দ্বের সকাল, যেখানে উৎসবের ঢাকে কাঠি পড়ে ঠিকই, কিন্তু সবাই জানে বিদায়ের ঘণ্টা বেজে গেছে।",
            "এই হলো বিজয়া।"
          ]
        },
        {
          heading: "দেবী বিজয়ী—তবু বাঙালি দেখে এক কন্যার বিদায়",
          text: [
            "'বিজয়া' কথাটির আক্ষরিক অর্থ বিজয় বা অসুরদলন। আর দশমী হলো দশম দিন।\nকিন্তু বাঙালির হৃদয়ে এই দিনটি অন্য এক আবেগের উপাখ্যান বহন করে।",
            "দুর্গা এখানে কেবল মহাশক্তি নন, তিনি ঘরের আদরের মেয়ে উমা—যিনি বাপের বাড়িতে চারটি দিন কাটিয়ে এবার স্বামী শিবের সাথে ফিরে যাচ্ছেন হিমালয়ের কৈলাসে।",
            "এই পারিবারিক রূপক কোনো আধুনিক ভাবালুতা নয়। ১৮৭৮–৮৩ সালের একটি ঐতিহাসিক লিথোগ্রাফ, যা বর্তমানে নিউ ইয়র্কের মেট্রোপলিটন মিউজিয়াম অফ আর্টে সংরক্ষিত, তার শিরোনাম ছিল 'বিজয়া'। সেখানে দেখা যায় শিব এসে দাঁড়িয়েছেন দুর্গাকে নিয়ে যেতে, আর গৃহের মহিলারা চোখের জলে মেয়েকে বিদায় জানাচ্ছেন। মিউজিয়াম কর্তৃপক্ষ উল্লেখ করেছে যে, বিবাহিত কন্যার পিতৃগৃহ ছেড়ে শ্বশুরবাড়ি যাওয়ার এই চিরন্তন বিচ্ছেদ-বেদনা আবহমান কাল থেকেই বাঙালি সংস্কৃতির গভীরতম আবেগের বিষয়।",
            "এক শতকেরও বেশি আগে শিল্পীরা ক্যানভাসে সেই বেদনাই এঁকেছিলেন, যা আজ দশমীর সকালে প্রতিটি বাঙালি নিজের বুকে অনুভব করে।",
            "একদিকে মহাজাগতিক লড়াইয়ে দেবীর জয়োল্লাস।\nঅন্যদিকে ঘরের মেয়ে চলে যাওয়ার বুকভাঙা কান্না।\nএই দুই অনুভূতি দশমীর সকালে এক বিন্দুতে এসে মেলে।"
          ]
        },
        {
          heading: "দেবী বরণ: মেয়েকে বিদায়ের প্রস্তুতি",
          text: [
            "বিসর্জনের আগে বাংলার প্রতিটি ঘরে ও পুজোমণ্ডপে অনুষ্ঠিত হয় 'দেবী বরণ'।",
            "বাড়ির মেয়ের মতো দুর্গাকে মিষ্টিমুখ করানো হয়, মুখে পানপাতা ছোঁয়ানো হয় এবং কুলো ও তেল-হলুদে বিদায় জানানো হয়।",
            "বনেদি বাড়ি ও বিভিন্ন মণ্ডপের নিজস্ব কিছু অনন্য প্রথা থাকে। কোথাও কোথাও আবার 'দর্পণ বিসর্জন' অনুষ্ঠিত হয়—যেখানে একটি কাঁসার পাত্রে জল রেখে তাতে দেবীর প্রতিচ্ছবি দেখে পুরোহিত প্রতীকী বিসর্জন সম্পন্ন করেন।",
            "এই বৈচিত্র্য প্রমাণ করে যে, বাংলার দুর্গাপূজা কোনো বাঁধাধরা কঠোর সংহিতা নয়; এটি এক জীবন্ত সাংস্কৃতিক ধারার পরিবার।"
          ]
        },
        {
          heading: "লাল-সাদার ভিড় যখন আরও লাল হয়ে ওঠে",
          text: [
            "বরণের পর শুরু হয় দশমীর সবচেয়ে রঙীন ও আলোকোজ্জ্বল আচার: সিঁদুর খেলা।",
            "ঐতিহাসিকভাবে সধবা মহিলারা দেবীর কপালে সিঁদুর পরিয়ে একে অপরের গালে সিঁদুর মাখিয়ে দেন—স্বামীর দীর্ঘায়ু ও পরিবারের মঙ্গলের কামনায়।",
            "তবে ইন্টারনেটের তথাকথিত ইতিহাসের একটি ভুল ধারণা সংশোধন করা প্রয়োজন:\nসিঁদুর খেলার সঠিক সূচনার কোনো অকাট্য ঐতিহাসিক দিনক্ষণ পাওয়া যায় না।",
            "এটি ঠিক ৪০০ বছর আগে শুরু হয়েছিল কিংবা কোনো এক নির্দিষ্ট জমিদারের বাড়িতে প্রথম ঘটেছিল—এমন দাবির কোনো শক্ত ঐতিহাসিক প্রমাণ নেই। এমনকি দ্য ইন্ডিয়ান এক্সপ্রেসের প্রতিবেদনেও উল্লেখ করা হয়েছে যে এই আচারের সুনির্দিষ্ট প্রাচীন উৎস আজও অজানা।",
            "তবে সাম্প্রতিক সময়ে এই আচার অনেক বেশি উদার ও মানবিক রূপ নিয়েছে। বহু মণ্ডপে অবিবাহিত নারী, বিধবা ও রূপান্তরকামীরাও সিঁদুর খেলায় আনন্দ সহকারে অংশ নেন। উৎসবের আনন্দ যখন সকলের হয়ে ওঠে, তখনই তা প্রকৃত সর্বজনীন হয়ে ওঠে।"
          ]
        },
        {
          heading: "শেষবারের মতো নড়ে ওঠে প্রতিমা",
          text: [
            "একসময় মণ্ডপ ছাড়তেই হয় প্রতিমাকে।\nযে শান্ত মুখখানি দেখার জন্য দূর-দূরান্ত থেকে মানুষ ছুটে এসেছিল, তাঁকে এবার কাঁধে তুলে নেওয়া হয়।\nঢাকে বাজে বিদায়ের বিষাদী সুর।\nজনস্রোত পা বাড়ায় গঙ্গার ঘাটের দিকে।",
            "ইউনেস্কোর নথিতে দশমীর এই বিসর্জনকে দুর্গাপূজা চক্রের স্বাভাবিক পূর্ণতা হিসেবে বর্ণনা করা হয়েছে: পোড়ামাটি নয়, বরং কাঁচা মাটির তৈরি দেবীমূর্তি আবার নদীতে মিশে যায়—যে মাটির উপাদান থেকে তিনি সৃষ্টি হয়েছিলেন, সেখানেই তাঁর বিলীন হওয়া।",
            "এই চক্রের মধ্যে এক পরম দার্শনিক সত্য লুকিয়ে আছে:\n\nমাটি রূপ নিল শরীরে।\nশরীর রূপ নিল দেবীতে।\nদেবী রূপ নিলেন এক অমর স্মৃতিতে।\nআর শরীর আবার ফিরে গেল মাটির গর্ভে।",
            "পার্থিব শিল্পকর্মটি বিলীন হয়ে যায়, কিন্তু ঐতিহ্যটি অমর থাকে ঠিক এই কারণেই—কারণ সে আবার ফিরে আসবে।"
          ]
        },
        {
          heading: "“আসছে বছর আবার হবে”",
          text: [
            "বিসর্জনের ঘাটে কিন্তু নিস্তব্ধ শোক থাকে না।\nচোখের জলের সাথে মিশে থাকে এক বজ্রকণ্ঠের অঙ্গীকার:\n\nআসছে বছর আবার হবে!\nAaschhe bochhor abar hobe —\nNext year, it will happen again.",
            "এই একটি বাক্যই বিজয়ার পুরো দর্শনকে ব্যাখ্যা করে।\nএই বিদায় সত্য, কিন্তু এই বিদায় কখনও অন্তিম নয়।\nদেবী ফিরে যাচ্ছেন ঠিকই, কিন্তু আবার ফিরে আসার পাকা কথা দিয়ে।"
          ]
        },
        {
          heading: "এবং তারপর বিজয়া মোড় নেয় মানুষের দিকে",
          text: [
            "প্রতিমা গঙ্গায় বিলীন হওয়ার পর, উৎসবের আলো এসে পড়ে ঈশ্বরের থেকে মানুষের ওপর।",
            "বিজয়ার চিরাচরিত নিয়মে ছোটরা বড়দের পায়ে হাত দিয়ে প্রণাম করে আশীর্বাদ নেয়, সমবয়সীরা কোলাকুলি করে ভ্রাতৃত্বের আলিঙ্গন বাঁধে, আর বাড়িতে বাড়িতে মিষ্টির থালা সাজিয়ে শুরু হয় শুভেচ্ছা বিনিময়। বিভিন্ন সমাজতাত্ত্বিক গবেষণায় দেখা গেছে, প্রতিমা বিসর্জনের পর এই মিষ্টিমুখ, প্রণাম ও কোলাকুলির সামাজিক পর্বটি সপ্তাহজুড়ে চলতে থাকে।",
            "অর্থাৎ বিজয়া কেবল পুজোর শেষ দৃশ্য নয়।\nএটি এক গভীর সামাজিক বন্ধনের সূচনা।",
            "পরিচিতের দরজায় কড়া নাড়া।\nনিমের নাড়ু আর গজার প্যাকেট খোলা।\nবড়দের আশীর্বাদের হাত তরুণদের মাথায় রাখা।\nপুজোর ভিড়ে যাদের সাথে দেখা হয়নি, তাদের সাথে একসাথে বসে গল্প করা।",
            "বাড়ি বাড়ি পৌঁছে যায় সেই মধুর বার্তা: “শুভ বিজয়া”।\nগণউন্মাদনার কার্নিভাল এবার পরিণত হয় ঘরের মানুষের নিবিড় ভালোবাসায়।"
          ]
        },
        {
          heading: "সম্ভবত সেই কারণেই দশমী এত কষ্ট দেয়",
          text: [
            "চারটে দিন যে মণ্ডপটাকে মনে হচ্ছিল কোনো স্থায়ী স্বর্গরাজ্য, তা হঠাৎ বড্ড ফাঁকা আর ক্ষণস্থায়ী মনে হয়।\nদর্শনার্থীদের সেই অন্তহীন লাইন উধাও।\nঝাড়বাতির আলো নিভিয়ে ফেলা হয়েছে।\nখোলা হচ্ছে কাপড়ের সাজসজ্জা।\nভিড় নিয়ে যারা দু'দিন আগে বিরক্তি প্রকাশ করছিল, তারাই আজ সেই ভিড়টাকে বড় বেশি মিস করে।",
            "আর বহু দূরে কুমোরটুলিতে, মৃৎশিল্পীরা ইতিমধ্যেই ভাবতে শুরু করেছেন আগামী বছরের কথা।",
            "এটাই বিজয়ার অন্তরে লুকিয়ে থাকা চিরন্তন দ্বন্দ্ব:\nআমরা বিজয়োৎসব পালন করি অশ্রুজলে বিদায় জানাতে জানাতে।\nআমরা পরম যত্নে বিসর্জন দিই যা আমরা মাসের পর মাস ধরে সৃষ্টি করেছিলাম।\nআমরা বিদায় বলি এই প্রতিশ্রুতি নিয়ে যে আবার দেখা হবে।",
            "আর সেই কারণেই দুর্গাপূজার শেষ দৃশ্যটি নদীতে ডুবে যাওয়া কোনো মাটির প্রতিমা নয়।\n\nতা হলো গঙ্গার ঘাট থেকে শহরের দিকে মুখ ফিরিয়ে মানুষের উচ্চারণ করা সেই অনন্ত আকুতি—\n\nশুভ বিজয়া।\nভালো থেকো মা।\nনিরাপদে যেও, আবার এসো আমাদের ঘরে।"
          ]
        }
      ]
    }
  }
];
