"""
Process Discovery Modülü - 3 Farklı Algoritma
Inductive Miner, Alpha Miner, Heuristics Miner
"""

import pm4py
import pandas as pd
import os
from pm4py.objects.log.importer.xes import importer as xes_importer
from pm4py.objects.conversion.log import converter as log_converter
from pm4py.algo.discovery.inductive import algorithm as inductive_miner
from pm4py.algo.discovery.alpha import algorithm as alpha_miner
from pm4py.algo.discovery.heuristics import algorithm as heuristics_miner
from pm4py.visualization.petri_net import visualizer as pn_visualizer


class ProcessDiscovery:
    """Process Discovery - 3 Algoritma"""
    
    @staticmethod
    def convert_dataframe_to_eventlog(df):
        """
        Pandas DataFrame'i pm4py EventLog'a dönüştür
        
        Args:
            df: Columns: case_id, activity, timestamp
            
        Returns:
            pm4py EventLog objesi
        """
        try:
            # DataFrame'i copy et
            df_copy = df.copy()
            
            # Sütun adlarını pm4py standardına dönüştür
            df_copy.rename(columns={
                'case_id': 'case:concept:name',
                'activity': 'concept:name',
                'timestamp': 'time:timestamp'
            }, inplace=True)
            
            # Timestamp'ı datetime'a çevir
            if 'time:timestamp' in df_copy.columns:
                df_copy['time:timestamp'] = pd.to_datetime(df_copy['time:timestamp'])
            
            # EventLog'a dönüştür
            event_log = log_converter.apply(df_copy)
            
            return event_log
            
        except Exception as e:
            print(f"DataFrame to EventLog conversion hatası: {e}")
            return None
    
    @staticmethod
    def discover_with_inductive_miner(event_log):
        """
        Inductive Miner Algoritması
        Rekursif olarak process model'i keşfeder. Çoğu durumda en iyi sonuçları verir.
        
        Args:
            event_log: pm4py EventLog objesi
            
        Returns:
            tuple: (petri_net, initial_marking, final_marking)
        """
        try:
            print("🔍 Inductive Miner çalışıyor...")
            print(f"   Event log uzunluğu: {len(event_log)}")
            
            # Process Tree döndürür, bunu Petri Net'e çevir
            process_tree = inductive_miner.apply(event_log)
            net, initial_marking, final_marking = pm4py.convert_to_petri_net(process_tree)
            
            print(f"✅ Inductive Miner tamamlandı")
            print(f"   Places: {len(net.places)}, Transitions: {len(net.transitions)}")
            return net, initial_marking, final_marking
        except Exception as e:
            print(f"❌ Inductive Miner hatası: {e}")
            import traceback
            traceback.print_exc()
            return None, None, None
    
    @staticmethod
    def discover_with_alpha_miner(event_log):
        """
        Alpha Miner Algoritması
        Klasik algoritma, basit process'ler için iyi çalışır.
        
        Args:
            event_log: pm4py EventLog objesi
            
        Returns:
            tuple: (petri_net, initial_marking, final_marking)
        """
        try:
            print("🔍 Alpha Miner çalışıyor...")
            net, initial_marking, final_marking = alpha_miner.apply(event_log)
            print("✅ Alpha Miner tamamlandı")
            return net, initial_marking, final_marking
        except Exception as e:
            print(f"Alpha Miner hatası: {e}")
            return None, None, None
    
    @staticmethod
    def discover_with_heuristics_miner(event_log, dependency_threshold=0.5):
        """
        Heuristics Miner Algoritması
        Frequently-occurring patterns'ı prioritize eder.
        
        Args:
            event_log: pm4py EventLog objesi
            dependency_threshold: Dependency için threshold (0-1)
            
        Returns:
            tuple: (petri_net, initial_marking, final_marking)
        """
        try:
            print("🔍 Heuristics Miner çalışıyor...")
            print(f"   Dependency threshold: {dependency_threshold}")

            parameters = {
                heuristics_miner.Variants.CLASSIC.value.Parameters.DEPENDENCY_THRESH: dependency_threshold
            }
            net, initial_marking, final_marking = heuristics_miner.apply(event_log, parameters=parameters)

            print("✅ Heuristics Miner tamamlandı")
            print(f"   Places: {len(net.places)}, Transitions: {len(net.transitions)}")
            return net, initial_marking, final_marking
            
        except Exception as e:
            print(f"❌ Heuristics Miner hatası: {e}")
            import traceback
            traceback.print_exc()
            return None, None, None

    @staticmethod
    def visualize_petri_net(petri_net, initial_marking, final_marking, output_filename="model.png"):
        """
        Petri Net'i PNG olarak görselleştir
        
        Args:
            petri_net: Keşfedilen Petri Net
            initial_marking: Başlangıç marking'i
            final_marking: Final marking'i
            output_filename: Çıktı dosya adı
            
        Returns:
            str: Çıktı dosya yolu
        """
        try:
            output_path = os.path.join(
                os.path.dirname(__file__), 
                "outputs", 
                output_filename
            )
            
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Graphviz yolunu ekle
            os.environ["PATH"] += os.pathsep + r"C:\Program Files\Graphviz\bin"
            
            # Görselleştir
            gviz = pn_visualizer.apply(
                petri_net,
                initial_marking,
                final_marking
            )
            pn_visualizer.save(gviz, output_path)

            
            print(f"✅ Görselleştirme kaydedildi: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"Görselleştirme hatası: {e}")
            return None
    
    @staticmethod
    def get_petri_net_info(petri_net, initial_marking, final_marking):
        """
        Petri Net hakkında bilgi (place, transition sayıları vb)
        
        Returns:
            dict: Petri Net bilgileri
        """
        try:
            places = len(petri_net.places)
            transitions = len(petri_net.transitions)
            arcs = len(petri_net.arcs)
            
            return {
                "places": places,
                "transitions": transitions,
                "arcs": arcs,
                "total_nodes": places + transitions
            }
        except Exception as e:
            print(f"Petri Net info hatası: {e}")
            return {}

# Kullanım Örneği
if __name__ == "__main__":
    from .dbconnect import get_logs
    
    print("Process Discovery Modülü Yüklendi")
    print("Fonksiyonlar hazır:")
    print("  - discover_with_inductive_miner()")
    print("  - discover_with_alpha_miner()")
    print("  - discover_with_heuristics_miner()")