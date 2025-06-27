import json
import requests
from bs4 import BeautifulSoup
import time
import re
import os

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3"
ROADMAP_FILE = "mia_symbolic_roadmap.json"
CYCLES = 5
SLEEP_BETWEEN_CYCLES = 2

# Carica roadmap simbolica
if os.path.exists(ROADMAP_FILE):
    with open(ROADMAP_FILE, "r", encoding="utf-8") as f:
        roadmap = json.load(f)
else:
    roadmap = {
        "focus_symbols": [],
        "open_questions": [],
        "operational_recommendations": []
    }

# Funzione per generare prompt simbolici

def generate_prompt(symbols, questions):
    if questions:
        q = questions[0]
    else:
        q = "Approfondisci uno dei seguenti concetti: " + ", ".join(symbols[:5])
    return f"Rispondi in modo rigoroso e simbolico alla domanda: '{q}'. Usa i simboli chiave: {', '.join(symbols[:8])}."

# Funzione per interrogare Ollama

def ask_ollama(prompt, model=OLLAMA_MODEL):
    response = requests.post(OLLAMA_URL, json={
        "model": model,
        "prompt": prompt,
        "stream": False
    })
    return response.json()["response"]

# Funzione di scraping simbolico

def web_search(symbols, question):
    # Usa i simboli come query per scraping mirato (placeholder: Wikipedia + arXiv)
    base = "https://en.wikipedia.org/wiki/"
    links = [base + s.replace(" ", "_") for s in symbols[:3]]
    links.append("https://arxiv.org/search/?query=" + "+".join(symbols[:3]) + "&searchtype=all")
    return links

def scrape_url(url):
    try:
        html = requests.get(url, timeout=10).text
        soup = BeautifulSoup(html, "html.parser")
        return soup.get_text()[:2000]
    except Exception as e:
        return f"[Errore scraping {url}: {e}]"

def estrai_simboli_concetti(testo):
    simboli = set()
    simboli.update(re.findall(r"\b([A-Z][A-Za-z0-9_\-]{2,})\b", testo))
    simboli.update(re.findall(r"\b([A-Za-z]+\s(?:problem|theory|model|force|gravity|energy|wave|system|phenomena|experiment|framework|trap|cloud|atom|quantum|scaling|error|data|simulation|universe|dimension|boson|relativity|symmetry|inflation|black hole|wormhole|neutron star|supernova))\b", testo, re.IGNORECASE))
    simboli.update(re.findall(r"\b([A-Za-z]+\d*)\^?\d*\b", testo))
    simboli = {s.strip() for s in simboli if len(s.strip()) > 2}
    return list(simboli)

def estrai_domande_aperte(peer_review):
    domande = []
    pattern = r"(?:Open questions:|Domande aperte:|Questions:)([\s\S]+?)(?:\n\n|$)"
    match = re.search(pattern, peer_review, re.IGNORECASE)
    if match:
        blocco = match.group(1)
        domande += re.findall(r"\d+\.\s*(.+)", blocco)
    domande += re.findall(r"([A-Z][^\n\r\.!?]*\?)", peer_review)
    domande = [d.strip() for d in set(domande) if len(d.strip()) > 10]
    return domande

def ciclo_symbolic(roadmap, ciclo_num):
    print(f"\n=== CICLO {ciclo_num+1} ===\n")
    prompt = generate_prompt(roadmap["focus_symbols"], roadmap["open_questions"])
    print(f"Prompt generato: {prompt}")
    risposta = ask_ollama(prompt)
    simboli_risposta = estrai_simboli_concetti(risposta)
    print("Simboli/concetti chiave dalla risposta:")
    print(simboli_risposta)

    links = web_search(roadmap["focus_symbols"], roadmap["open_questions"][0] if roadmap["open_questions"] else "")
    fonti = []
    for url in links:
        testo = scrape_url(url)
        fonti.append(testo[:500])
        time.sleep(1)

    peer_prompt = (
        f"Risposta simbolica generata:\n{risposta}\n\n"
        f"Fonti web correlate:\n{''.join(fonti)}\n\n"
        "Fai una peer review simbolica, segnala punti deboli, suggerisci miglioramenti e nuove domande di ricerca. Elenca chiaramente le domande aperte o i dubbi che rimangono."
    )
    review = ask_ollama(peer_prompt)
    simboli_review = estrai_simboli_concetti(review)
    print("Simboli/concetti chiave dalla peer review:")
    print(simboli_review)
    domande_aperte = estrai_domande_aperte(review)
    if domande_aperte:
        print("Domande aperte/dubbi estratti per il prossimo ciclo:")
        for d in domande_aperte:
            print(f"- {d}")
    else:
        print("Nessuna domanda aperta trovata. Il ciclo si fermerà.")
    # Aggiorna roadmap simbolica
    roadmap["focus_symbols"] = list(set(roadmap["focus_symbols"] + simboli_risposta + simboli_review))
    roadmap["open_questions"] = domande_aperte
    return roadmap

def visualizza_roadmap(roadmap):
    print("\n=== ROADMAP SIMBOLICA AGGIORNATA ===\n")
    print(json.dumps(roadmap, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    for ciclo in range(CYCLES):
        roadmap = ciclo_symbolic(roadmap, ciclo)
        visualizza_roadmap(roadmap)
        with open(ROADMAP_FILE, "w", encoding="utf-8") as f:
            json.dump(roadmap, f, indent=2, ensure_ascii=False)
        if not roadmap["open_questions"]:
            break
        time.sleep(SLEEP_BETWEEN_CYCLES) 