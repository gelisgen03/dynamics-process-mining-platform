"""
Algoritma Karşılaştırma Modülü
Birden fazla discovery algoritmalarının sonuçlarını karşılaştır ve rankla
"""

from .process_discovery import ProcessDiscovery
from .model_metrics import ModelMetrics
from typing import Dict, List
import json


class ProcessComparison:
    """Process Discovery Algoritmaları Karşılaştırma"""
    
    @staticmethod
    def compare_algorithms(log, algorithms: List[str] = None) -> Dict:
        """
        Belirtilen algoritmaları aynı event log'da çalıştır ve karşılaştır
        
        Args:
            log: Event log (pm4py EventLog)
            algorithms: Çalıştırılacak algoritmaların listesi
                       Default: ["inductive", "alpha", "heuristics"]
            
        Returns:
            Dict: Her algoritma için metrikler + ranking
        """
        
        if algorithms is None:
            algorithms = ["inductive", "alpha", "heuristics"]
        
        results = {}
        
        for algo in algorithms:
            print(f"\n{'='*60}")
            print(f"🔍 {algo.upper()} MINER çalıştırılıyor...")
            print(f"{'='*60}")
            
            try:
                # Algoritma çalıştır
                if algo == "inductive":
                    petri_net, initial_marking, final_marking = \
                        ProcessDiscovery.discover_with_inductive_miner(log)
                        
                elif algo == "alpha":
                    petri_net, initial_marking, final_marking = \
                        ProcessDiscovery.discover_with_alpha_miner(log)
                        
                elif algo == "heuristics":
                    petri_net, initial_marking, final_marking = \
                        ProcessDiscovery.discover_with_heuristics_miner(
                            log, dependency_threshold=0.5
                        )
                else:
                    print(f"⚠️ Bilinmeyen algoritma: {algo}")
                    continue
                
                # Metrikleri hesapla
                metrics = ModelMetrics.get_model_quality_score(
                    log,
                    petri_net,
                    initial_marking,
                    final_marking
                )
                
                results[algo] = {
                    "status": "success",
                    "metrics": metrics,
                    "petri_net_info": ProcessDiscovery.get_petri_net_info(petri_net, initial_marking, final_marking)
                }
                
                print(f"✅ {algo.upper()} Başarılı")
                print(f"   Overall Score: {metrics['overall_score']}/100")
                
            except Exception as e:
                print(f"❌ {algo.upper()} Hata: {str(e)}")
                results[algo] = {
                    "status": "error",
                    "error": str(e),
                    "metrics": None
                }
        
        return results
    
    @staticmethod
    def get_ranked_results(comparison_results: Dict) -> List[Dict]:
        """
        Karşılaştırma sonuçlarını overall_score'a göre sırala
        
        Args:
            comparison_results: compare_algorithms() çıktısı
            
        Returns:
            List[Dict]: Ranking sırasında algoritmaların listesi
        """
        
        ranked = []
        
        for algo_name, algo_data in comparison_results.items():
            if algo_data["status"] == "success":
                ranked.append({
                    "rank": None,  # Sonra set edilecek
                    "algorithm": algo_name,
                    "overall_score": algo_data["metrics"]["overall_score"],
                    "fitness": algo_data["metrics"]["fitness"],
                    "precision": algo_data["metrics"]["precision"],
                    "generalization": algo_data["metrics"]["generalization"],
                    "simplicity": algo_data["metrics"]["simplicity"],
                    "petri_net_info": algo_data["petri_net_info"]
                })
        
        # Overall score'a göre azalan sıra
        ranked.sort(key=lambda x: x["overall_score"], reverse=True)
        
        # Rank ata
        for idx, item in enumerate(ranked, 1):
            item["rank"] = idx
        
        return ranked
    
    @staticmethod
    def get_comparison_table(log, algorithms: List[str] = None) -> Dict:
        """
        Tümleşik fonksiyon: algoritmaları çalıştır, karşılaştır, rankla
        
        Args:
            log: Event log
            algorithms: Çalıştırılacak algoritmaların listesi
            
        Returns:
            Dict: 
                - results: Ham sonuçlar (her algoritma için metrikleri)
                - ranking: Sıralanmış sonuçlar
                - best_algorithm: En iyi skor alan algoritma
        """
        
        print("\n" + "="*60)
        print("🔄 ALGORITMA KARŞILAŞTIRMASI BAŞLANIYOR")
        print("="*60)
        
        # Algoritmaları çalıştır
        results = ProcessComparison.compare_algorithms(log, algorithms)
        
        # Rankla
        ranking = ProcessComparison.get_ranked_results(results)
        
        best_algorithm = ranking[0] if ranking else None
        
        print("\n" + "="*60)
        print("📊 SONUÇ TABLOSU")
        print("="*60)
        
        for item in ranking:
            print(f"\n{item['rank']}. {item['algorithm'].upper()}")
            print(f"   Skor: {item['overall_score']}/100")
            print(f"   Fitness: {item['fitness']:.3f}")
            print(f"   Precision: {item['precision']:.3f}")
            print(f"   Generalization: {item['generalization']:.3f}")
            print(f"   Simplicity: {item['simplicity']:.3f}")
        
        if best_algorithm:
            print(f"\n✅ EN İYİ ALGORİTMA: {best_algorithm['algorithm'].upper()} " +
                  f"({best_algorithm['overall_score']}/100)")
        
        return {
            "results": results,
            "ranking": ranking,
            "best_algorithm": best_algorithm
        }


# Kullanım Örneği
if __name__ == "__main__":
    print("Algoritma Karşılaştırması Modülü Yüklendi")
    print("Fonksiyonlar hazır:")
    print("  - compare_algorithms()")
    print("  - get_ranked_results()")
    print("  - get_comparison_table()")