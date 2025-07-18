"""
MIAL Dashboard Integration
Adds MIAL language support to the MIA dashboard
"""

import streamlit as st
import subprocess
import json
import os
from datetime import datetime

class MialDashboardExtension:
    def __init__(self):
        self.mial_path = "./mial/bin/mial.js"
        self.examples_path = "./mial/examples"
        
    def show_mial_interface(self):
        st.header("🧠 MIAL - AI Native Programming Language")
        st.markdown("**Meta-Ignorance AI Language** - Programming for AI systems")
        
        # Language overview
        with st.expander("🎯 Language Overview"):
            st.markdown("""
            **MIAL** is an AI-native programming language designed specifically for artificial intelligence systems, 
            symbolic reasoning, and meta-cognitive computing.
            
            **Key Features:**
            - **Probabilistic Programming**: Built-in support for uncertainty and confidence levels
            - **Meta-Reasoning**: Native constructs for reasoning about reasoning
            - **Symbolic Computation**: First-class support for mathematical symbols
            - **Self-Modification**: Code that can modify itself based on learning
            - **MIA Integration**: Seamless integration with the MIA system
            """)
        
        # Code editor
        st.subheader("💻 MIAL Code Editor")
        
        # Example selection
        example_options = {
            "Custom": "",
            "Basic": self.get_example_code("basic"),
            "Probabilistic": self.get_example_code("probabilistic"),
            "Meta-Reasoning": self.get_example_code("meta_reasoning"),
            "Symbolic Computation": self.get_example_code("symbolic_computation"),
            "Fusion Research": self.get_example_code("fusion_research")
        }
        
        selected_example = st.selectbox("Select Example", list(example_options.keys()))
        
        # Code input
        code_input = st.text_area(
            "MIAL Code",
            value=example_options[selected_example],
            height=300,
            help="Enter your MIAL code here"
        )
        
        # Execution controls
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("▶️ Execute Code"):
                self.execute_mial_code(code_input)
        
        with col2:
            if st.button("🔍 Validate Syntax"):
                self.validate_mial_syntax(code_input)
        
        with col3:
            if st.button("📊 Show Language Info"):
                self.show_language_info()
        
        # Integration status
        st.subheader("🔗 MIA Integration Status")
        self.show_integration_status()
        
        # Recent executions
        st.subheader("📜 Recent Executions")
        self.show_recent_executions()
    
    def get_example_code(self, example_name):
        """Get example code from file"""
        try:
            file_path = os.path.join(self.examples_path, f"{example_name}.mial")
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    return f.read()
        except Exception as e:
            st.error(f"Error loading example: {e}")
        return ""
    
    def execute_mial_code(self, code):
        """Execute MIAL code"""
        if not code.strip():
            st.warning("Please enter some MIAL code to execute")
            return
        
        try:
            # Save code to temporary file
            temp_file = f"temp_mial_{int(datetime.now().timestamp())}.mial"
            with open(temp_file, 'w') as f:
                f.write(code)
            
            # Execute MIAL code
            result = subprocess.run(
                ["node", self.mial_path, temp_file],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # Clean up temp file
            os.remove(temp_file)
            
            # Display results
            st.success("✅ Code executed successfully!")
            
            if result.stdout:
                st.subheader("📤 Output:")
                st.code(result.stdout, language="text")
            
            if result.stderr:
                st.subheader("⚠️ Errors/Warnings:")
                st.code(result.stderr, language="text")
            
            # Log execution
            self.log_execution(code, result.stdout, result.stderr)
            
        except subprocess.TimeoutExpired:
            st.error("❌ Code execution timed out (30s limit)")
        except Exception as e:
            st.error(f"❌ Execution error: {e}")
    
    def show_language_info(self):
        """Show language information"""
        try:
            result = subprocess.run(
                ["node", self.mial_path, "info"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                st.info("📋 MIAL Language Information")
                st.code(result.stdout)
            else:
                st.error("❌ Could not retrieve language information")
                
        except Exception as e:
            st.error(f"❌ Error: {e}")
    
    def show_integration_status(self):
        """Show MIA integration status"""
        # Check if MIA roadmap exists
        mia_roadmap_exists = os.path.exists("mia_symbolic_roadmap.json")
        
        if mia_roadmap_exists:
            st.success("✅ MIA Integration Active")
            
            # Load roadmap info
            try:
                with open("mia_symbolic_roadmap.json", 'r') as f:
                    roadmap = json.load(f)
                
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.metric("Total Symbols", roadmap.get('metadata', {}).get('total_symbols', 0))
                
                with col2:
                    st.metric("Open Questions", roadmap.get('metadata', {}).get('total_questions', 0))
                
                with col3:
                    st.metric("Peer Reviews", len(roadmap.get('peer_reviews', [])))
                
            except Exception as e:
                st.error(f"Error loading roadmap: {e}")
        else:
            st.warning("⚠️ MIA Integration Disabled - Roadmap not found")
    
    def show_recent_executions(self):
        """Show recent MIAL executions"""
        log_file = "mial_execution_log.json"
        
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r') as f:
                    logs = json.load(f)
                
                # Show last 5 executions
                recent_logs = logs[-5:] if len(logs) > 5 else logs
                
                for i, log in enumerate(reversed(recent_logs)):
                    with st.expander(f"Execution {len(recent_logs) - i} - {log['timestamp']}"):
                        st.code(log['code'], language="text")
                        if log['output']:
                            st.text("Output:")
                            st.code(log['output'])
                        if log['errors']:
                            st.text("Errors:")
                            st.code(log['errors'])
                            
            except Exception as e:
                st.error(f"Error loading execution log: {e}")
        else:
            st.info("No recent executions")
    
    def log_execution(self, code, output, errors):
        """Log MIAL execution"""
        log_file = "mial_execution_log.json"
        
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'code': code,
            'output': output,
            'errors': errors
        }
        
        try:
            logs = []
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    logs = json.load(f)
            
            logs.append(log_entry)
            
            # Keep only last 50 executions
            if len(logs) > 50:
                logs = logs[-50:]
            
            with open(log_file, 'w') as f:
                json.dump(logs, f, indent=2)
                
        except Exception as e:
            st.error(f"Error logging execution: {e}")

if __name__ == "__main__":
    st.set_page_config(page_title="MIAL Dashboard", layout="wide")
    mial_extension = MialDashboardExtension()
    mial_extension.show_mial_interface()