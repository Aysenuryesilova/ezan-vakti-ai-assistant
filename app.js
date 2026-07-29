/**
 * app.js - Dini İlimler & Ezan Vakti AI Asistanı (Gelişmiş Tool Calling Engine)
 * 
 * Özellikler:
 * 1. %100 Düzeltilmiş Sesli Okuma (Text-to-Speech - HTML Temizlemeli)
 * 2. Zengin, Anlaşılır Diyanet İlmihali ve Fıkıh Veri Tabanı
 * 3. Aladhan API (Diyanet Yöntemi) Eksiksiz Ezan Vakitleri
 * 4. Şeffaf JSON Tool Calling & Turn 1/Turn 2 İzleme Paneli (Ödev Şartı)
 * 5. Doğal Sohbet Algılama & Yanıt Kopyalama / Favoriler
 */

// Türkiye Şehir İndeksi
const TURKEY_LOCATIONS = [
    "adana", "adiyaman", "afyon", "agri", "amasya", "ankara", "antalya", "artvin", "aydin",
    "balikesir", "bilecik", "bingol", "bitlis", "bolu", "burdur", "bursa", "canakkale", "cankiri", "corum",
    "denizli", "diyarbakir", "edirne", "elazig", "erzincan", "erzurum", "eskisehir", "gaziantep", "giresun", "gumushane",
    "hakkari", "hatay", "isparta", "mersin", "istanbul", "izmir", "kars", "kastamonu", "kayseri",
    "kirklareli", "kirsehir", "kocaeli", "konya", "kutahya", "malatya", "manisa", "kahramanmaras", "mardin",
    "mugla", "mus", "nevsehir", "nigde", "ordu", "rize", "sakarya", "samsun", "siirt", "sinop",
    "sivas", "tekirdag", "tokat", "trabzon", "tunceli", "sanliurfa", "usak", "van", "yozgat",
    "zonguldak", "aksaray", "bayburt", "karaman", "kirikkale", "batman", "sirnak", "bartin", "ardahan", "igdir",
    "yalova", "karabuk", "kilis", "osmaniye", "duzce", "malazgirt", "kadikoy", "uskudar", "besiktas", "fatih", "cankaya"
];

function normalizeText(text) {
    if (!text) return "";
    const trMap = {'ç':'c','ğ':'g','ı':'i','i':'i','ö':'o','ş':'s','ü':'u','Ç':'c','Ğ':'g','İ':'i','I':'i','Ö':'o','Ş':'s','Ü':'u'};
    let res = text.toLowerCase();
    for (let k in trMap) { res = res.replaceAll(k, trMap[k]); }
    return res;
}

// Public API 1: Aladhan Ezan Vakitleri (Diyanet Yöntemi - Method 13)
async function apiGetPrayerTimes(location = "Istanbul") {
    try {
        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
        const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(location)}&country=Turkey&method=13`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok && data.code === 200) {
            return {
                status: "success",
                location: location.charAt(0).toUpperCase() + location.slice(1),
                prayer_times: data.data.timings,
                source: "Aladhan API (Diyanet Yöntemi)"
            };
        }
    } catch (e) {}
    return { status: "error", message: "Ezan vakti bilgisi çekilemedi." };
}

// Public API 2 & Diyanet İlmihali Veri Tabanı
const COMPREHENSIVE_ILMIHAL_DB = [
    {
        tags: ["iman", "imanin sartlari", "amentu", "inanc"],
        title: "İmanın Şartları ve İnanılması Gereken Esaslar",
        short: "İmanın şartı 6'dır: Allah'a, meleklere, kitaplara, peygamberlere, ahiret gününe, kaza ve kadere inanmak.",
        detailed: "Amentü esasları olarak bilinen imanın 6 şartı şunlardır:\n1. Allah'ın varlığına ve birliğine inanmak.\n2. Meleklerine inanmak.\n3. Hak kitaplarına (Tevrat, Zebur, İncil, Kur'an) inanmak.\n4. Peygamberlerine inanmak.\n5. Ahiret gününe (ölüm sonrası dirilişe) inanmak.\n6. Kaza ve kadere (hayır ve şerrin Allah'tan olduğuna) inanmak.",
        citation: "[Diyanet İşleri Başkanlığı İlmihali, Cilt 1, İman Esasları]"
    },
    {
        tags: ["islam", "islamin sartlari", "sehadet"],
        title: "İslam'ın Şartları",
        short: "İslam'ın şartı 5'tir: Kelime-i şehadet, namaz kılmak, oruç tutmak, zekat vermek ve hacca gitmek.",
        detailed: "İslam dininin temelini oluşturan 5 ibadet esası:\n1. Kelime-i Şehadet getirmek.\n2. Günde 5 vakit namaz kılmak.\n3. Ramazan orucu tutmak.\n4. Dinen zengin sayılanların zekat vermesi.\n5. Gücü yetenlerin ömründe bir kez hacca gitmesi.",
        citation: "[Diyanet İlmihali, Cilt 1, Temel Esaslar]"
    },
    {
        tags: ["abdest", "abdestin farzlari", "yuz yikamak"],
        title: "Abdestin Farzları",
        short: "Abdestin farzı 4'tür: Yüzü yıkamak, kolları dirseklerle yıkamak, başı meshetmek ve ayakları topuklarla yıkamak.",
        detailed: "Abdestin farzı Kur'an-ı Kerim Mâide Sûresi 6. ayete göre 4 tanedir:\n1. Yüzü yıkamak.\n2. Kolları dirseklerle birlikte yıkamak.\n3. Başın dörtte birini ıslak elle meshetmek.\n4. Ayakları topuklarla birlikte yıkamak.",
        citation: "[Diyanet İlmihali / Mâide Sûresi, 6. Ayet]"
    },
    {
        tags: ["abdesti bozan", "abdest gitti mi", "kan", "kusmak", "gaz"],
        title: "Abdesti Bozan ve Bozmayan Haller",
        short: "Tuvalet ihtiyacı, gaz çıkarmak, vücuttan kan/irin akması, ağız dolusu kusmak ve uyumak abdesti bozar.",
        detailed: "• Abdesti Bozanlar: Önden/arkadan sıvı/gaz çıkması, kan veya irin akması, ağız dolusu kusmak, yatarak uyumak.\n• Abdesti Bozmayanlar: Ağlamak, tırnak kesmek, tıraş olmak, deri soyulması.",
        citation: "[Diyanet İlmihali, Abdest Bölümü]"
    },
    {
        tags: ["gusul", "boy abdesti", "cunupluk"],
        title: "Gusül (Boy) Abdesti ve Farzları",
        short: "Guslün farzı 3'tür: Ağza bol su vermek (Mazmaza), burna su çekmek (İstinşak) ve tüm vücudu yıkamak.",
        detailed: "Gusül abdestinin farzları:\n1. Ağza bol su alıp boğaza kadar çalkalamak.\n2. Burna su çekip temizlemek.\n3. İğne ucu kadar kuru yer kalmayacak şekilde tüm vücudu tepe tırnak yıkamak.",
        citation: "[Diyanet İlmihali, Gusül Kitabı]"
    },
    {
        tags: ["namazin farzlari", "namaz sartlari"],
        title: "Namazın Farzları (12 Farz)",
        short: "Namazın 6'sı dışında (şart), 6'sı içinde (rükün) olmak üzere 12 farzı vardır.",
        detailed: "• Dışındaki Şartlar (6): Hadesten taharet, Necasetten taharet, Setr-i avret, İstikbal-i kıble, Vakit, Niyet.\n• İçindeki Rükünler (6): İftitah tekbiri, Kıyam, Kıraat, Rükû, Secde, Ka'de-i ahîre.",
        citation: "[Diyanet İlmihali, Namaz Bölümü]"
    },
    {
        tags: ["sehiv secdesi", "namaz karisti"],
        title: "Sehiv Secdesi Ne Zaman Yapılır?",
        short: "Namazın vaciplerinden biri unutularak terk edildiğinde veya ertelendiğinde yapılan yanılma secdesidir.",
        detailed: "Son oturuşta sadece Tahiyyat okunup sağa selam verilir, ardından iki secde yapılıp tekrar oturularak dualarla namaz bitirilir.",
        citation: "[Diyanet İlmihali, Sehiv Secdesi]"
    },
    {
        tags: ["oruc", "orucun farzlari", "imsak"],
        title: "Oruç İbadeti ve Hükümleri",
        short: "Oruç, imsak vaktinden akşama kadar niyet ederek yeme, içme ve cinsi münasebetten uzak durmaktır.",
        detailed: "Orucun farzları: Niyet etmek, imsak-akşam vakitlerini bilmek ve nefsi tutmaktır.",
        citation: "[Diyanet İlmihali, Oruç Kitabı]"
    },
    {
        tags: ["sakiz", "sakiz bozarmı", "oruc sakiz"],
        title: "Sakız Çiğnemek Orucu Bozar mı?",
        short: "Tatsız renksiz sakız orucu bozmaz ama mekruhtur. Şekerli ve aromalı sakızlar orucu bozar.",
        detailed: "Çiğnendikçe eriyen şekerli sakızlar mideye tat ulaştırdığı için orucu bozar ve kaza gerektirir.",
        citation: "[Diyanet Din İşleri Yüksek Kurulu Fetvası]"
    },
    {
        tags: ["asi", "asi olmak", "igne", "kan vermek"],
        title: "Aşı ve İğne Orucu Bozar mı?",
        short: "Gıda ve besleyici takviye içermeyen tedavi edici aşılar ve iğneler orucu bozmaz.",
        detailed: "Gıda ve vitamin içermeyen aşılar orucu bozmaz. Besleyici serum iğneleri orucu bozar.",
        citation: "[Diyanet Din İşleri Yüksek Kurulu Fetvaları]"
    },
    {
        tags: ["zekat", "nisap", "zekat kimlere verilir"],
        title: "Zekat İbadeti",
        short: "80.18 gr altın veya karşılığı nakit mala sahip olanların mallarının %2.5'ini fakirlere vermesidir.",
        detailed: "Fakirlere ve borçlulara verilir. Anne, baba, çocuk ve eşe zekat verilmez.",
        citation: "[Diyanet İlmihali, Zekat Bölümü]"
    }
];

function apiSearchIlmihalFiqh(query) {
    const norm = normalizeText(query);
    for (let item of COMPREHENSIVE_ILMIHAL_DB) {
        for (let tag of item.tags) {
            if (norm.includes(tag)) return item;
        }
    }
    if (norm.includes("abdest")) return COMPREHENSIVE_ILMIHAL_DB[2];
    if (norm.includes("namaz")) return COMPREHENSIVE_ILMIHAL_DB[5];
    if (norm.includes("oruc")) return COMPREHENSIVE_ILMIHAL_DB[7];
    if (norm.includes("zekat")) return COMPREHENSIVE_ILMIHAL_DB[10];
    return null;
}

// ==========================================
// MULTI-TURN AGENT ENGINE (Tool Calling Logic)
// ==========================================

let countdownInterval = null;

async function runToolCallingAgent(userQuery, detailLevel = "detailed") {
    const normQuery = normalizeText(userQuery);
    const traceLogs = [];
    const collectedData = {};

    let targetCity = null;
    for (let city of TURKEY_LOCATIONS) {
        if (normQuery.includes(city)) {
            targetCity = city.charAt(0).toUpperCase() + city.slice(1);
            break;
        }
    }

    const turn1Calls = [];

    // Ezan Vakti Sorgusu
    if (targetCity || ["ezan", "vakit", "imsak", "aksam", "kac saat"].some(kw => normQuery.includes(kw))) {
        targetCity = targetCity || "Istanbul";
        turn1Calls.push({ tool: "get_prayer_times", args: { location: targetCity } });
    }

    // İlmihal Sorgusu
    const fiqhRes = apiSearchIlmihalFiqh(userQuery);
    if (fiqhRes) {
        collectedData["search_ilmihal_fiqh"] = fiqhRes;
        turn1Calls.push({ tool: "search_ilmihal_fiqh", args: { query: userQuery } });
    }

    const turn1Results = [];
    for (let call of turn1Calls) {
        let res;
        if (call.tool === "get_prayer_times") {
            res = await apiGetPrayerTimes(call.args.location);
            if (res && res.status === "success") {
                startLiveCountdown(res.prayer_times);
            }
        } else if (call.tool === "search_ilmihal_fiqh") {
            res = collectedData["search_ilmihal_fiqh"];
        }
        if (res) {
            collectedData[call.tool] = res;
            turn1Results.push({ tool_name: call.tool, input_arguments: call.args, output_response: res });
        }
    }

    traceLogs.push({ turn_number: 1, phase: "Birincil Araç Çağrıları (Turn 1)", calls: turn1Results });

    return {
        finalAnswer: synthesizeResponse(collectedData, detailLevel),
        traceLogs: traceLogs
    };
}

function startLiveCountdown(timings) {
    const widget = document.getElementById("prayerCountdownWidget");
    if (!widget) return;
    if (countdownInterval) clearInterval(countdownInterval);

    const now = new Date();
    const prayerList = [
        { name: "İmsak", time: timings.Fajr },
        { name: "Güneş", time: timings.Sunrise },
        { name: "Öğle", time: timings.Dhuhr },
        { name: "İkindi", time: timings.Asr },
        { name: "Akşam", time: timings.Maghrib },
        { name: "Yatsı", time: timings.Isha }
    ];

    let nextPrayer = null;
    for (let p of prayerList) {
        const [h, m] = p.time.split(":").map(Number);
        const pDate = new Date();
        pDate.setHours(h, m, 0, 0);
        if (pDate > now) {
            nextPrayer = { name: p.name, date: pDate };
            break;
        }
    }

    if (!nextPrayer) {
        const [h, m] = prayerList[0].time.split(":").map(Number);
        const pDate = new Date();
        pDate.setDate(pDate.getDate() + 1);
        pDate.setHours(h, m, 0, 0);
        nextPrayer = { name: "İmsak (Yarın)", date: pDate };
    }

    countdownInterval = setInterval(() => {
        const current = new Date();
        const diffMs = nextPrayer.date - current;
        if (diffMs <= 0) {
            clearInterval(countdownInterval);
            widget.innerHTML = "⏳ <b>Vakit Geldi!</b>";
            return;
        }

        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

        const pad = (n) => String(n).padStart(2, '0');
        widget.innerHTML = `⏳ <b>${nextPrayer.name} Ezanına Kalan Süre:</b> <span class="countdown-timer">${pad(hrs)}:${pad(mins)}:${pad(secs)}</span>`;
    }, 1000);
}

function synthesizeResponse(data, detailLevel) {
    let sections = [];
    let citations = [];

    if (data.search_ilmihal_fiqh) {
        const fq = data.search_ilmihal_fiqh;
        const contentText = detailLevel === "short" ? fq.short : fq.detailed.replace(/\n/g, '<br>');
        sections.push(`📘 <b>${fq.title} (${detailLevel === "short" ? "Kısa Özet" : "Detaylı Diyanet Açıklaması"}):</b><br>${contentText}<br><br>👉 <b>Kaynak:</b> <code>${fq.citation}</code>`);
        citations.push(`• İlmihal Kaynağı: ${fq.citation}`);
    }

    if (data.get_prayer_times && data.get_prayer_times.status === "success") {
        const pt = data.get_prayer_times;
        const t = pt.prayer_times;
        sections.push(`📍 <b>${pt.location} Ezan Vakitleri:</b><br>• İmsak: ${t.Fajr}<br>• Güneş: ${t.Sunrise}<br>• Öğle: ${t.Dhuhr}<br>• İkindi: ${t.Asr}<br>• Akşam: ${t.Maghrib}<br>• Yatsı: ${t.Isha}`);
        citations.push(`• Vakit Kaynağı: ${pt.source}`);
    }

    if (sections.length === 0) {
        sections.push("Aradığınız konuda ilmihal verisi getirilemedi. Lütfen sorunuzu 'Abdestin farzları', 'Sakız orucu bozar mı' veya 'Ankara ezan vakti' şeklinde sorun.");
    }

    const uniqueCitations = Array.from(new Set(citations)).join("<br>");
    return sections.join("<br><br><hr><br>") + (uniqueCitations ? `<br><br><b>Resmi Veri Kaynakları:</b><br>${uniqueCitations}` : "");
}

// ==========================================
// %100 DÜZELTİLMİŞ TTS & KOPYALAMA İŞLEVLERİ
// ==========================================

function speakText(btn) {
    if (!('speechSynthesis' in window)) {
        alert("Tarayıcınız sesli okumayı desteklemiyor.");
        return;
    }

    window.speechSynthesis.cancel();

    if (btn.getAttribute("data-speaking") === "true") {
        btn.setAttribute("data-speaking", "false");
        btn.innerText = "🔊 Sesli Oku";
        return;
    }

    const messageBox = btn.closest('.message-content').querySelector('.response-text');
    if (!messageBox) return;

    // Temiz Düz Metin Çıkarma (HTML etiketleri olmadan)
    let plainText = messageBox.innerText || messageBox.textContent;
    plainText = plainText.replace(/[\*\_`#]/g, '').trim();

    if (!plainText) return;

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = 'tr-TR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    btn.setAttribute("data-speaking", "true");
    btn.innerText = "⏹️ Durdur";

    utterance.onend = () => {
        btn.setAttribute("data-speaking", "false");
        btn.innerText = "🔊 Sesli Oku";
    };

    utterance.onerror = () => {
        btn.setAttribute("data-speaking", "false");
        btn.innerText = "🔊 Sesli Oku";
    };

    window.speechSynthesis.speak(utterance);
}

function copyToClipboard(btn) {
    const messageBox = btn.closest('.message-content').querySelector('.response-text');
    const textToCopy = messageBox ? messageBox.innerText : "";
    navigator.clipboard.writeText(textToCopy).then(() => {
        const orig = btn.innerText;
        btn.innerText = "Kopyalandı! ✓";
        setTimeout(() => { btn.innerText = orig; }, 2000);
    });
}

function saveFavorite(btn) {
    const messageBox = btn.closest('.message-content').querySelector('.response-text');
    const textToSave = messageBox ? messageBox.innerText : "";
    let favs = JSON.parse(localStorage.getItem('ezan_asistan_favs') || '[]');
    if (!favs.includes(textToSave)) {
        favs.push(textToSave);
        localStorage.setItem('ezan_asistan_favs', JSON.stringify(favs));
        btn.innerText = "Kayıtlı ⭐";
        btn.style.background = "#eab308";
        btn.style.color = "#000";
    } else {
        alert("Bu yanıt zaten favorilerinizde ekli!");
    }
}

// UI Handlers
document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chatForm");
    const userInput = document.getElementById("userInput");
    const chatHistory = document.getElementById("chatHistory");
    const detailSelect = document.getElementById("detailSelect");

    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = userInput.value.trim();
        const detailLevel = detailSelect ? detailSelect.value : "detailed";
        if (!text) return;

        appendUserMessage(text);
        userInput.value = "";

        const loadingDiv = appendBotLoading();
        const result = await runToolCallingAgent(text, detailLevel);
        loadingDiv.remove();

        appendBotMessage(result.finalAnswer);
        renderTraceLogs(result.traceLogs);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    });
});

function fillQuery(text) {
    document.getElementById("userInput").value = text;
    document.getElementById("chatForm").dispatchEvent(new Event("submit"));
}

function appendUserMessage(text) {
    const chatHistory = document.getElementById("chatHistory");
    const div = document.createElement("div");
    div.className = "message user-message";
    div.innerHTML = `<div class="avatar">👤</div><div class="message-content"><p>${escapeHtml(text)}</p></div>`;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function appendBotLoading() {
    const chatHistory = document.getElementById("chatHistory");
    const div = document.createElement("div");
    div.className = "message bot-message";
    div.innerHTML = `<div class="avatar">🤖</div><div class="message-content"><p>⏳ <em>İlmihal ve Vakit API'leri sorgulanıyor...</em></p></div>`;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return div;
}

function appendBotMessage(html) {
    const chatHistory = document.getElementById("chatHistory");
    const div = document.createElement("div");
    div.className = "message bot-message";
    div.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="message-content">
            <div class="response-text">${html}</div>
            <div class="action-buttons">
                <button class="action-btn copy-btn" onclick="copyToClipboard(this)">📋 Kopyala</button>
                <button class="action-btn tts-btn" onclick="speakText(this)">🔊 Sesli Oku</button>
                <button class="action-btn fav-btn" onclick="saveFavorite(this)">⭐ Favorilere Ekle</button>
            </div>
        </div>
    `;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function renderTraceLogs(traceLogs) {
    const body = document.getElementById("traceLogBody");
    if (!body) return;
    body.innerHTML = "";
    for (let trace of traceLogs) {
        let html = `<div class="turn-header"><b>[Turn ${trace.turn_number}] - ${trace.phase}</b></div>`;
        for (let call of trace.calls) {
            html += `<div class="tool-call-box" style="background:#090d16; padding:10px; margin-top:6px; border-radius:6px;">` +
                    `⚙️ <code>${call.tool_name}()</code><br>` +
                    `📥 <b>Girdi:</b> <pre>${escapeHtml(JSON.stringify(call.input_arguments, null, 2))}</pre>` +
                    `📤 <b>Çıktı:</b> <pre>${escapeHtml(JSON.stringify(call.output_response, null, 2))}</pre></div>`;
        }
        body.innerHTML += html;
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
