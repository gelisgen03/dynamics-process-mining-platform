"""
Model Metrikleri Modülü - Process Mining Models için Kalite Ölçütleri
Fitness, Precision, Generalization, Simplicity
"""

import pm4py
from pm4py.algo.evaluation.generalization import algorithm as generalization_evaluator
from typing import Dict


class ModelMetrics:
    """Process Mining Model Metrikleri Hesaplama"""
    
    @staticmethod
    def calculate_fitness(log, petri_net, initial_marking, final_marking) -> float:
        """
        Fitness Metriği: Model event log'u ne kadar iyi açıklıyor?
        
        Değer: 0-1 (1 = Mükemmel uyum, 0 = Hiç uyum yok)
        
        Mantık: Trace replay algoritması kullanarak, her trace'in modelden kaç adımda 
        geçebildiğini hesapla.
        
        Args:
            log: Event log (pm4py EventLog objesi)
            petri_net: Keşfedilen Petri net
            initial_marking: Başlangıç marking'i
            final_marking: Final marking'i
            
        Returns:
            float: 0-1 arasında fitness puanı
        """
        try:
            print("📊 Fitness hesaplanıyor...")

            fitness_result = pm4py.fitness_token_based_replay(
                log, petri_net, initial_marking, final_marking
            )
            fitness = fitness_result['log_fitness']
            fitness = min(max(fitness, 0.0), 1.0)
            print(f"✅ Fitness: {fitness:.3f}")
            return fitness

        except Exception as e:
            print(f"⚠️ Fitness hesaplama hatası: {e}")
            raise
    
    @staticmethod
    def calculate_precision(log, petri_net, initial_marking, final_marking) -> float:
        """
        Precision Metriği: Model ne kadar "overfitting" yapıyor?
        
        Değer: 0-1 (1 = Model sadece gözlemlenen davranışları üretiyor, 0 = Çok fazla davranış)
        
        Mantık: Modelin gözlemlenmeyen davranışlar üretip üretmediğini kontrol et.
        Eğer model sadece log'da gözlemlenen aktiviteleri üretirse precision yüksek.
        
        Args:
            log: Event log
            petri_net: Keşfedilen Petri net
            initial_marking: Başlangıç marking'i
            final_marking: Final marking'i
            
        Returns:
            float: 0-1 arasında precision puanı
        """
        try:
            print("📊 Precision hesaplanıyor...")

            precision = pm4py.precision_token_based_replay(
                log, petri_net, initial_marking, final_marking
            )
            precision = min(max(precision, 0.0), 1.0)
            print(f"✅ Precision: {precision:.3f}")
            return precision

        except Exception as e:
            print(f"⚠️ Precision hesaplama hatası: {e}")
            raise

    
    @staticmethod
    def calculate_generalization(log, petri_net, initial_marking, final_marking) -> float:
        """
        Generalization Metriği: Model yeni trace'leri ne kadar iyi genelleme yapıyor?
        
        Değer: 0-1 (1 = Çok iyi genelleme, 0 = Kötü genelleme)
        
        Mantık: Modelin sadece training data'ya fit olmaktan ziyade,
        yeni verileride anlaması için ne kadar esnek olduğunu ölçer.
        
        Args:
            log: Event log
            petri_net: Keşfedilen Petri net
            initial_marking: Başlangıç marking'i
            final_marking: Final marking'i
            
        Returns:
            float: 0-1 arasında generalization puanı
        """
        try:
            print("📊 Generalization hesaplanıyor...")

            generalization = generalization_evaluator.apply(
                log, petri_net, initial_marking, final_marking
            )
            generalization = min(max(generalization, 0.0), 1.0)
            print(f"✅ Generalization: {generalization:.3f}")
            return generalization

        except Exception as e:
            print(f"⚠️ Generalization hesaplama hatası: {e}")
            raise
    
    @staticmethod
    def calculate_simplicity(petri_net) -> float:
        """
        Simplicity Metriği: Model ne kadar basit ve anlaşılır?
        
        Değer: 0-1 (1 = Çok basit, 0 = Çok kompleks)
        
        Mantık: 
        - Düşük node sayısı = basit
        - Düşük edge sayısı = basit
        - Düşük cyclic structure = basit
        
        Args:
            petri_net: Keşfedilen Petri net
            
        Returns:
            float: 0-1 arasında simplicity puanı
        """
        try:
            print("📊 Simplicity hesaplanıyor...")
            
            # Petri net bileşenleri say
            places = len(petri_net.places)
            transitions = len(petri_net.transitions)
            arcs = len(petri_net.arcs)
            
            total_nodes = places + transitions

            # 10 node → 1.0, 200 node → 0.0 (doğrusal ölçek)
            simplicity = max(0.0, 1.0 - (total_nodes - 10) / 190)

            # Çok fazla arc varsa (spaghetti) ayrıca cezalandır
            if arcs > total_nodes * 3:
                simplicity *= 0.8
            
            simplicity = min(max(simplicity, 0.0), 1.0)
            print(f"✅ Simplicity: {simplicity:.3f}")
            
            return simplicity
            
        except Exception as e:
            print(f"⚠️ Simplicity hesaplama hatası: {e}")
            return 0.5
    
    @staticmethod
    def get_model_quality_score(
        log,
        petri_net,
        initial_marking,
        final_marking,
        weights: Dict = None
    ) -> Dict:
        """
        Genel Model Kalite Puanı (0-100)
        
        Varsayılan ağırlıklar:
        - Fitness: 40% (modelin gözlemlenen davranışları ne kadar iyi açıklar)
        - Precision: 30% (modelin gereksiz davranış ne kadar üretiyor)
        - Generalization: 20% (yeni veriler için esneklik)
        - Simplicity: 10% (model karmaşıklığı)
        
        Args:
            log: Event log
            petri_net: Keşfedilen Petri net
            initial_marking: Başlangıç marking'i
            final_marking: Final marking'i
            weights: Opsiyonel ağırlıklar (default: yukarıdaki)
            
        Returns:
            Dict: Tüm metriklerin detaylı sonuçları
        """
        
        if weights is None:
            weights = {
                "fitness": 0.40,
                "precision": 0.30,
                "generalization": 0.20,
                "simplicity": 0.10
            }
        
        print("\n🎯 Model Kalite Puanı Hesaplanıyor...\n")
        
        # Her metriği hesapla
        fitness = ModelMetrics.calculate_fitness(log, petri_net, initial_marking, final_marking)
        precision = ModelMetrics.calculate_precision(log, petri_net, initial_marking, final_marking)
        generalization = ModelMetrics.calculate_generalization(log, petri_net, initial_marking, final_marking)
        simplicity = ModelMetrics.calculate_simplicity(petri_net)
        
        # Weighted score hesapla
        overall_score = (
            fitness * weights["fitness"] +
            precision * weights["precision"] +
            generalization * weights["generalization"] +
            simplicity * weights["simplicity"]
        ) * 100
        
        # Sonuçları döndür
        result = {
            "fitness": round(fitness, 3),
            "precision": round(precision, 3),
            "generalization": round(generalization, 3),
            "simplicity": round(simplicity, 3),
            "overall_score": round(overall_score, 2),
            "weights": weights,
            "petri_net_info": {
                "places": len(petri_net.places),
                "transitions": len(petri_net.transitions),
                "arcs": len(petri_net.arcs)
            }
        }
        
        return result


# Kullanım Örneği
if __name__ == "__main__":
    print("Model Metrikleri Modülü Yüklendi")
    print("Fonksiyonlar hazır:")
    print("  - calculate_fitness()")
    print("  - calculate_precision()")
    print("  - calculate_generalization()")
    print("  - calculate_simplicity()")
    print("  - get_model_quality_score()")

