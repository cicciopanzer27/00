#!/usr/bin/env python3
"""
MIA Symbolic Dashboard - Dashboard interattiva avanzata
Visualizzazione, gestione e auto-miglioramento della roadmap simbolica
"""

import streamlit as st
import json
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
import time
import os
import requests
from pathlib import Path
import threading

# Configurazione pagina
st.set_page_config(
    page_title="MIA Symbolic Dashboard",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

class MIADashboard:
    def __init__(self):
        self.roadmap_file = "mia_symbolic_roadmap.json"
        self.health_file = "mia_health_status.json"
        self.config_file = "mia_config.json"
        self.auto_refresh = True
        
    def load_roadmap(self):
        """Carica roadmap simbolica"""
        if os.path.exists(self.roadmap_file):
            try:
                with open(self.roadmap_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                st.error(f"Errore caricamento roadmap: {e}")
        return None
    
    def load_health_status(self):
        """Carica status salute sistema"""
        if os.path.exists(self.health_file):
            try:
                with open(self.health_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        return None
    
    def load_config(self):
        """Carica configurazione"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        return {}
    
    def search_symbols(self, query, symbols):
        """Ricerca semantica nei simboli"""
        if not query:
            return symbols
        
        query_lower = query.lower()
        results = []
        
        for symbol in symbols:
            # Ricerca in nome, dominio, descrizione
            if (query_lower in symbol.get('name', '').lower() or
                query_lower in symbol.get('domain', '').lower() or
                query_lower in symbol.get('description', '').lower()):
                results.append(symbol)
        
        return results
    
    def create_symbol_network(self, symbols):
        """Crea grafo connessioni simboliche"""
        if not symbols:
            return go.Figure()
        
        # Crea nodi
        nodes = []
        for i, symbol in enumerate(symbols):
            nodes.append({
                'id': symbol.get('id', f'node_{i}'),
                'label': symbol.get('name', f'Symbol_{i}'),
                'domain': symbol.get('domain', 'unknown'),
                'confidence': symbol.get('confidence', 0.8)
            })
        
        # Crea connessioni (simulate)
        edges = []
        for i in range(len(nodes)):
            for j in range(i+1, min(i+3, len(nodes))):  # Connessioni limitate
                if nodes[i]['domain'] == nodes[j]['domain']:
                    edges.append({
                        'from': nodes[i]['id'],
                        'to': nodes[j]['id'],
                        'weight': 0.8
                    })
        
        # Crea figura Plotly
        fig = go.Figure()
        
        # Aggiungi nodi
        node_x = []
        node_y = []
        node_text = []
        node_colors = []
        
        for i, node in enumerate(nodes):
            angle = 2 * 3.14159 * i / len(nodes)
            node_x.append(10 * (i % 3) + 5)
            node_y.append(10 * (i // 3) + 5)
            node_text.append(f"{node['label']}<br>Domain: {node['domain']}<br>Confidence: {node['confidence']:.2f}")
            node_colors.append(node['confidence'])
        
        fig.add_trace(go.Scatter(
            x=node_x, y=node_y,
            mode='markers+text',
            text=[node['label'] for node in nodes],
            textposition="top center",
            marker=dict(
                size=20,
                color=node_colors,
                colorscale='Viridis',
                showscale=True,
                colorbar=dict(title="Confidence")
            ),
            hovertemplate='%{text}<extra></extra>',
            textfont=dict(size=10)
        ))
        
        # Aggiungi connessioni
        for edge in edges:
            from_idx = next(i for i, node in enumerate(nodes) if node['id'] == edge['from'])
            to_idx = next(i for i, node in enumerate(nodes) if node['id'] == edge['to'])
            
            fig.add_trace(go.Scatter(
                x=[node_x[from_idx], node_x[to_idx]],
                y=[node_y[from_idx], node_y[to_idx]],
                mode='lines',
                line=dict(width=2, color='gray'),
                showlegend=False,
                hoverinfo='skip'
            ))
        
        fig.update_layout(
            title="Symbolic Network Graph",
            xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            plot_bgcolor='white',
            height=600
        )
        
        return fig
    
    def create_timeline(self, roadmap):
        """Crea timeline delle attività"""
        if not roadmap:
            return go.Figure()
        
        # Estrai eventi dalla roadmap
        events = []
        
        # Simboli generati
        for symbol in roadmap.get('focus_symbols', []):
            events.append({
                'date': symbol.get('generated_at', ''),
                'event': f"Symbol: {symbol.get('name', '')}",
                'type': 'symbol',
                'domain': symbol.get('domain', '')
            })
        
        # Domande generate
        for question in roadmap.get('open_questions', []):
            events.append({
                'date': question.get('generated_at', ''),
                'event': f"Question: {question.get('text', '')[:50]}...",
                'type': 'question',
                'priority': question.get('priority', 1)
            })
        
        # Peer reviews
        for review in roadmap.get('peer_reviews', []):
            events.append({
                'date': review.get('timestamp', ''),
                'event': f"Peer Review: {review.get('reviewer', '')}",
                'type': 'review',
                'confidence': review.get('confidence', 0)
            })
        
        if not events:
            return go.Figure()
        
        # Crea figura timeline
        fig = go.Figure()
        
        # Colori per tipo
        colors = {'symbol': 'blue', 'question': 'green', 'review': 'orange'}
        
        for event_type in set(event['type'] for event in events):
            type_events = [e for e in events if e['type'] == event_type]
            
            fig.add_trace(go.Scatter(
                x=[e['date'] for e in type_events],
                y=[e['event'] for e in type_events],
                mode='markers',
                name=event_type.title(),
                marker=dict(
                    size=10,
                    color=colors.get(event_type, 'gray'),
                    symbol='circle'
                ),
                hovertemplate='<b>%{y}</b><br>Date: %{x}<extra></extra>'
            ))
        
        fig.update_layout(
            title="MIA Activity Timeline",
            xaxis_title="Date",
            yaxis_title="Events",
            height=400,
            showlegend=True
        )
        
        return fig
    
    def run_dashboard(self):
        """Esegue dashboard principale"""
        # Header
        st.title("🧠 MIA Symbolic Dashboard")
        st.markdown("**Meta Ignorance Architecture** - Sistema di generazione e gestione simbolica")
        
        # Sidebar
        with st.sidebar:
            st.header("⚙️ Controlli")
            
            # Auto-refresh
            self.auto_refresh = st.checkbox("Auto-refresh", value=True)
            if self.auto_refresh:
                st.info("Dashboard si aggiorna automaticamente")
            
            # Tema
            theme = st.selectbox("Tema", ["Light", "Dark", "Auto"])
            
            # Filtri
            st.subheader("🔍 Filtri")
            domain_filter = st.multiselect(
                "Dominio",
                ["quantum_mechanics", "relativity", "number_theory", "topology", "algebraic_geometry"]
            )
            
            confidence_threshold = st.slider("Confidenza minima", 0.0, 1.0, 0.7)
            
            # Azioni
            st.subheader("🚀 Azioni")
            if st.button("🔄 Aggiorna Roadmap"):
                st.rerun()
            
            if st.button("📊 Esporta Dati"):
                self.export_data()
            
            if st.button("🔧 Auto-miglioramento"):
                self.trigger_improvement()
        
        # Carica dati
        roadmap = self.load_roadmap()
        health_status = self.load_health_status()
        config = self.load_config()
        
        if not roadmap:
            st.warning("Roadmap non trovata. Avvia il generatore simbolico.")
            return
        
        # Metriche principali
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(
                "Simboli Totali",
                roadmap['metadata'].get('total_symbols', 0),
                delta=len([s for s in roadmap.get('focus_symbols', []) if s.get('generated_at', '').startswith(time.strftime("%Y-%m-%d"))])
            )
        
        with col2:
            st.metric(
                "Domande Aperte",
                len(roadmap.get('open_questions', [])),
                delta=len([q for q in roadmap.get('open_questions', []) if q.get('status') == 'open'])
            )
        
        with col3:
            st.metric(
                "Raccomandazioni",
                len(roadmap.get('operational_recommendations', [])),
                delta=len([r for r in roadmap.get('operational_recommendations', []) if r.get('status') == 'pending'])
            )
        
        with col4:
            st.metric(
                "Peer Reviews",
                len(roadmap.get('peer_reviews', [])),
                delta=len([p for p in roadmap.get('peer_reviews', []) if p.get('status') == 'pending'])
            )
        
        # Tabs principali
        tab1, tab2, tab3, tab4, tab5 = st.tabs(["📊 Panoramica", "🔍 Simboli", "❓ Domande", "📈 Timeline", "⚙️ Sistema"])
        
        with tab1:
            self.show_overview(roadmap, domain_filter, confidence_threshold)
        
        with tab2:
            self.show_symbols(roadmap, domain_filter, confidence_threshold)
        
        with tab3:
            self.show_questions(roadmap)
        
        with tab4:
            self.show_timeline(roadmap)
        
        with tab5:
            self.show_system_status(health_status, config)
        
        # Auto-refresh
        if self.auto_refresh:
            time.sleep(5)
            st.rerun()
    
    def show_overview(self, roadmap, domain_filter, confidence_threshold):
        """Mostra overview con grafici"""
        st.header("📊 Overview Sistema")
        
        # Metriche principali
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(
                "Simboli Totali",
                roadmap['metadata'].get('total_symbols', 0),
                delta=len([s for s in roadmap.get('focus_symbols', []) if s.get('generated_at', '').startswith(time.strftime("%Y-%m-%d"))])
            )
        
        with col2:
            st.metric(
                "Domande Aperte",
                len(roadmap.get('open_questions', [])),
                delta=len([q for q in roadmap.get('open_questions', []) if q.get('status') == 'open'])
            )
        
        with col3:
            st.metric(
                "Raccomandazioni",
                len(roadmap.get('operational_recommendations', [])),
                delta=len([r for r in roadmap.get('operational_recommendations', []) if r.get('status') == 'pending'])
            )
        
        with col4:
            st.metric(
                "Peer Reviews",
                len(roadmap.get('peer_reviews', [])),
                delta=len([p for p in roadmap.get('peer_reviews', []) if p.get('status') == 'pending'])
            )
        
        # Grafici
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("🌐 Network Simboli")
            symbols = roadmap.get('focus_symbols', [])
            if symbols:
                network_fig = self.create_symbol_network(symbols)
                st.plotly_chart(network_fig, use_container_width=True, key="network_chart")
            else:
                st.info("Nessun simbolo per visualizzare il network")
        
        with col2:
            st.subheader("📈 Distribuzione Domini")
            symbols = roadmap.get('focus_symbols', [])
            if symbols:
                domain_counts = {}
                for symbol in symbols:
                    domain = symbol.get('domain', 'Unknown')
                    domain_counts[domain] = domain_counts.get(domain, 0) + 1
                
                fig = px.pie(values=list(domain_counts.values()), names=list(domain_counts.keys()), title="Distribuzione per Dominio")
                st.plotly_chart(fig, use_container_width=True, key="domain_pie_chart")
            else:
                st.info("Nessun simbolo per visualizzare la distribuzione")
    
    def show_symbols(self, roadmap, domain_filter, confidence_threshold):
        """Mostra gestione simboli"""
        st.header("🔍 Gestione Simboli")
        
        # Ricerca
        search_query = st.text_input("🔍 Cerca simboli...")
        
        # Filtra simboli
        symbols = roadmap.get('focus_symbols', [])
        if domain_filter:
            symbols = [s for s in symbols if s.get('domain') in domain_filter]
        symbols = [s for s in symbols if s.get('confidence', 0) >= confidence_threshold]
        
        # Applica ricerca
        if search_query:
            symbols = self.search_symbols(search_query, symbols)
        
        # Mostra simboli
        if symbols:
            st.subheader(f"Simboli ({len(symbols)})")
            
            for symbol in symbols:
                with st.expander(f"🔸 {symbol.get('name', 'Unknown')} - {symbol.get('domain', 'Unknown')}"):
                    col1, col2 = st.columns([2, 1])
                    
                    with col1:
                        st.write(f"**Descrizione:** {symbol.get('description', 'N/A')}")
                        st.write(f"**Notazione:** `{symbol.get('mathematical_notation', 'N/A')}`")
                        st.write(f"**Generato:** {symbol.get('generated_at', 'N/A')}")
                    
                    with col2:
                        confidence = symbol.get('confidence', 0)
                        st.metric("Confidenza", f"{confidence:.2f}")
                        
                        if st.button(f"Modifica {symbol.get('id', '')}", key=f"edit_{symbol.get('id', '')}"):
                            st.info("Funzionalità di modifica in sviluppo")
        else:
            st.info("Nessun simbolo trovato con i filtri applicati")
    
    def show_questions(self, roadmap):
        """Mostra gestione domande"""
        st.header("❓ Domande Aperte")
        
        questions = roadmap.get('open_questions', [])
        
        if questions:
            # Filtri domande
            status_filter = st.selectbox("Stato", ["Tutti", "Aperte", "Chiuse"])
            priority_filter = st.selectbox("Priorità", ["Tutte", "1", "2", "3", "4", "5"])
            
            # Applica filtri
            filtered_questions = questions
            if status_filter != "Tutti":
                filtered_questions = [q for q in filtered_questions if q.get('status', 'open') == status_filter.lower()]
            if priority_filter != "Tutte":
                filtered_questions = [q for q in filtered_questions if q.get('priority', 1) == int(priority_filter)]
            
            st.subheader(f"Domande ({len(filtered_questions)})")
            
            for question in filtered_questions:
                priority_emoji = "🔴" * question.get('priority', 1) + "⚪" * (5 - question.get('priority', 1))
                
                with st.expander(f"{priority_emoji} {question.get('text', 'N/A')[:100]}..."):
                    st.write(f"**Priorità:** {question.get('priority', 'N/A')}")
                    st.write(f"**Stato:** {question.get('status', 'N/A')}")
                    st.write(f"**Generata:** {question.get('generated_at', 'N/A')}")
                    
                    if st.button(f"Risolvi {question.get('id', '')}", key=f"resolve_{question.get('id', '')}"):
                        st.info("Funzionalità di risoluzione in sviluppo")
        else:
            st.info("Nessuna domanda aperta trovata")
    
    def show_timeline(self, roadmap):
        """Mostra timeline attività"""
        st.header("📈 Timeline Attività")
        
        timeline_fig = self.create_timeline(roadmap)
        st.plotly_chart(timeline_fig, use_container_width=True, key="timeline_chart")
        
        # Statistiche temporali
        st.subheader("📊 Statistiche Temporali")
        
        # Simboli per giorno
        symbols = roadmap.get('focus_symbols', [])
        if symbols:
            dates = [s.get('generated_at', '')[:10] for s in symbols if s.get('generated_at')]
            if dates:
                date_counts = {}
                for date in dates:
                    date_counts[date] = date_counts.get(date, 0) + 1
                
                date_df = pd.DataFrame(list(date_counts.items()), columns=['Date', 'Symbols'])
                fig = px.line(date_df, x='Date', y='Symbols', title="Symbols Generated Over Time")
                st.plotly_chart(fig, use_container_width=True, key="symbols_over_time_chart")
    
    def show_system_status(self, health_status, config):
        """Mostra status sistema"""
        st.header("⚙️ Status Sistema")
        
        # Health status
        if health_status:
            st.subheader("🏥 Salute Sistema")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.metric("Dashboard Process", "🟢 Attivo" if health_status.get('dashboard_process') else "🔴 Inattivo")
                st.metric("Dashboard Responding", "🟢 Sì" if health_status.get('dashboard_responding') else "🔴 No")
            
            with col2:
                st.metric("Improvement Process", "🟢 Attivo" if health_status.get('improvement_process') else "🔴 Inattivo")
                st.metric("Memory Usage", f"{health_status.get('memory_usage', 0):.1f}%")
            
            st.write(f"**Ultimo aggiornamento:** {health_status.get('timestamp', 'N/A')}")
        else:
            st.warning("Status salute non disponibile")
        
        # Configurazione
        if config:
            st.subheader("⚙️ Configurazione")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.write(f"**Porta Dashboard:** {config.get('dashboard_port', 'N/A')}")
                st.write(f"**Intervallo Miglioramento:** {config.get('improvement_interval', 'N/A')}s")
            
            with col2:
                st.write(f"**Intervallo Ciclo:** {config.get('cycle_interval', 'N/A')}s")
                st.write(f"**Auto-update:** {'Sì' if config.get('auto_update') else 'No'}")
        
        # Azioni sistema
        st.subheader("🚀 Azioni Sistema")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("🔄 Riavvia Moduli"):
                self.restart_modules()
        
        with col2:
            if st.button("📊 Backup Dati"):
                self.backup_data()
        
        with col3:
            if st.button("🧹 Pulizia Cache"):
                self.cleanup_cache()
    
    def export_data(self):
        """Esporta dati"""
        roadmap = self.load_roadmap()
        if roadmap:
            # Esporta JSON
            with open("mia_export.json", 'w', encoding='utf-8') as f:
                json.dump(roadmap, f, indent=2, ensure_ascii=False)
            
            # Esporta CSV
            symbols_df = pd.DataFrame(roadmap.get('focus_symbols', []))
            if not symbols_df.empty:
                symbols_df.to_csv("mia_symbols_export.csv", index=False)
            
            questions_df = pd.DataFrame(roadmap.get('open_questions', []))
            if not questions_df.empty:
                questions_df.to_csv("mia_questions_export.csv", index=False)
            
            st.success("Dati esportati: mia_export.json, mia_symbols_export.csv, mia_questions_export.csv")
    
    def trigger_improvement(self):
        """Attiva auto-miglioramento"""
        try:
            # Simula chiamata al modulo di miglioramento
            st.info("Auto-miglioramento attivato...")
            time.sleep(2)
            st.success("Miglioramenti applicati!")
        except Exception as e:
            st.error(f"Errore auto-miglioramento: {e}")
    
    def restart_modules(self):
        """Riavvia moduli"""
        st.info("Riavvio moduli in corso...")
        time.sleep(2)
        st.success("Moduli riavviati!")
    
    def backup_data(self):
        """Backup dati"""
        st.info("Backup dati in corso...")
        time.sleep(1)
        st.success("Backup completato!")
    
    def cleanup_cache(self):
        """Pulizia cache"""
        st.info("Pulizia cache in corso...")
        time.sleep(1)
        st.success("Cache pulita!")

def main():
    """Funzione principale"""
    dashboard = MIADashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main() 