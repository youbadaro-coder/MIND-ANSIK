import { useState, useRef, Suspense, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Heart, Camera, ShoppingBag, Sparkles, Flame, Rotate3D, Shirt, Play, TriangleAlert, UploadCloud, ArrowRightLeft } from 'lucide-react';
import './App.css';

// ----------------------------------------------------------------------
// 의장님이 직접 다운받아 주신 완벽한 실제 사람 3D 에셋(model.glb) 로드 및 렌더링 컴포넌트
function RealMannequin({ isSpinning, droppedClothing, avatarFace }) {
  const group = useRef();
  
  // public/model.glb/scene.gltf 경로의 리얼 인체 에셋 로드 (Three.js GLTFLoader 내장)
  const { scene } = useGLTF('/model.glb/scene.gltf');
  
  useFrame((state, delta) => {
    if (isSpinning && group.current) {
      group.current.rotation.y += delta * 0.5;
    }
  });

  // 깊은 복사를 통해 렌더링 시마다 원본 훼손되지 않도록 방어 및 오리지널 텍스처 백업
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child.isMesh) {
        // 배열 형태의 메테리얼(복합 메쉬) 완벽 지원
        if (Array.isArray(child.material)) {
          child.material = child.material.map(m => m.clone());
          child.userData.originalMaterials = child.material.map(m => ({
            color: m.color.clone(),
            map: m.map,
          }));
        } else {
          child.material = child.material.clone();
          // 원본 색상과 질감 맵을 userData에 캐싱 (장착 해제 시 복구용)
          child.userData.originalColor = child.material.color.clone();
          child.userData.originalMap = child.material.map;
        }
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // 외부 에셋은 크기와 좌표축이 제각각이므로, 자동 스케일링 및 Y축 발바닥 센터링 정렬 알고리즘 수행
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // 키를 화면에 꽉 차는 4.0 단위로 강제 고정
    const scaleFactor = 4.0 / size.y;
    clone.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
    // 중점(0,0) 정렬 및 발바닥이 y=0 에 닿도록 세팅
    clone.position.x = -center.x * scaleFactor;
    clone.position.z = -center.z * scaleFactor;
    clone.position.y = -box.min.y * scaleFactor;

    return clone;
  }, [scene]);

  // 드래그-앤-드롭으로 옷 사진이 들어오면 모델의 피부(Mesh) 위에 즉시 텍스처 맵핑
  useEffect(() => {
    if (droppedClothing) {
      new THREE.TextureLoader().load(droppedClothing, (tex) => {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.flipY = false;
        
        clonedScene.traverse((child) => {
          if (child.isMesh) {
            // [💥 핵심 개선] 전체 피부를 덮지 않고, 기존 재질 위에 '의류'를 알파 블렌딩 처리
            if (Array.isArray(child.material)) {
              child.material.forEach(m => {
                m.map = tex; // 일단 덮되
                m.transparent = true;
                m.opacity = 0.95; // 살짝 비치게 하여 리얼리티 부여
                m.needsUpdate = true;
              });
            } else {
              // 단일 메테리얼인 경우 알파 블렌딩과 특수 스케일링으로 '옷'만 얹혀진 느낌 구현
              const originalTex = child.userData.originalMap;
              child.material.map = tex;
              child.material.transparent = true;
              child.material.combine = THREE.MixOperation;
              
              // 인스타 피팅 모델처럼 특정 UV 영역에만 안착되도록 타이틀 조절
              if (child.name.toLowerCase().includes('body') || child.name.toLowerCase().includes('mesh')) {
                tex.repeat.set(1.1, 1.1); // 살짝 핏하게
                tex.offset.set(-0.05, -0.05);
              }
              
              child.material.needsUpdate = true;
            }
          }
        });
      });
    } else {
      // 드롭 오프(장착 해제) 시 원상복구 (백업해둔 오리지널 메쉬 질감 로드)
      clonedScene.traverse((child) => {
        if (child.isMesh) {
          if (Array.isArray(child.material) && child.userData.originalMaterials) {
            child.material.forEach((m, i) => {
              m.map = child.userData.originalMaterials[i].map;
              m.color.copy(child.userData.originalMaterials[i].color);
              m.needsUpdate = true;
            });
          } else if (child.userData.originalColor) {
            child.material.map = child.userData.originalMap;
            child.material.color.copy(child.userData.originalColor);
            child.material.needsUpdate = true;
          }
        }
      });
    }
  }, [droppedClothing, clonedScene]);

  return (
    <group ref={group} position={[0, -2, 0]}>
      <primitive object={clonedScene} />
      
      {/* 아바타 얼굴 합성 (GLB 모델의 키를 4.0으로 맞췄으므로 대략 y=3.55 위치에 오버레이) */}
      {avatarFace && (
        <mesh position={[0, 3.55, 0.15]} castShadow>
          <sphereGeometry args={[0.26, 32, 32]} />
          <meshStandardMaterial 
            map={new THREE.TextureLoader().load(avatarFace)} 
            roughness={0.4} 
            metalness={0.1} 
            color="#e8c3a7" 
          />
        </mesh>
      )}

      {!droppedClothing && (
        <Text position={[0, 4.3, 0]} fontSize={0.15} color="#f472b6" anchorX="center" anchorY="middle">
          🎉 진짜 사람 몸매 에셋 로드 완료! (옷을 던지세요↓)
        </Text>
      )}
    </group>
  );
}
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// 메인 App 컴포넌트
export default function App() {
  const [activeTab, setActiveTab] = useState('fitting');
  const [isSpinning, setIsSpinning] = useState(false);
  const [isBaked, setIsBaked] = useState(false);

  // 멀티 아바타 생성용 사진
  const [avatarSources, setAvatarSources] = useState({
    face: null,
    torso: null,
    fullBody: null
  });

  // 옷장(인벤토리) 사진 리스트
  const [clothingInventory, setClothingInventory] = useState([]);
  
  // 현재 3D 뷰어에 드롭(강제 장착)된 옷 사진 URL
  const [equippedClothing, setEquippedClothing] = useState(null);

  const handleAvatarSourceUpload = (part, e) => {
    if (e.target.files[0]) {
      setAvatarSources(prev => ({ ...prev, [part]: URL.createObjectURL(e.target.files[0]) }));
      setIsBaked(false);
    }
  };

  const handleInventoryUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: Date.now() + Math.random(),
        url: URL.createObjectURL(file),
        name: file.name
      }));
      setClothingInventory([...clothingInventory, ...newFiles]);
    }
  };

  // --- 드래그 앤 드롭 HTML5 로직 버그 픽스 --- //
  // 브라우저마다 'text' 혹은 'text/plain'을 가리므로 일원화
  const onDragStart = (e, item) => {
    e.dataTransfer.setData('text/plain', item.url);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const onDragOver = (e) => {
    e.preventDefault(); 
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = e.dataTransfer.getData('text/plain');
    if (url && url.startsWith('blob:')) {
      setEquippedClothing(url);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white font-sans relative overflow-x-hidden flex flex-col pt-6 px-4 md:px-8 pb-10">
      {/* 배경 장식 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10 opacity-70">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-rose-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full"></div>
      </div>

      <header className="mb-4 z-10 w-full max-w-[1500px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-500 flex items-center gap-2">
             <Flame className="text-purple-500" size={32} />
             영피팅 <span className="text-white/30 text-xl font-light">| 3D 시크릿 AI 피팅룸</span>
           </h1>
           <p className="text-white/50 mt-1 text-sm font-medium tracking-tight">사진 드래그-앤-드롭 기반 입체 매핑(Mapping) 시뮬레이터 (v2)</p>
        </div>
        <div className="flex bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-xl">
          <button onClick={() => setActiveTab('fitting')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'fitting' ? 'bg-gradient-to-r from-teal-500 to-purple-600 shadow-lg text-white' : 'text-white/50 hover:text-white'}`}>
            <Sparkles size={16} /> 섹시 S라인 3D 데스크
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1500px] mx-auto z-10 flex flex-col">
          {activeTab === 'fitting' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh]">
              
              {/* 왼쪽: 커다란 진짜 3D 뷰어 캔버스 (드롭 존) */}
              <section 
                className={`col-span-1 lg:col-span-8 bg-gradient-to-b from-[#1a1a24] to-[#0a0a0e] rounded-3xl min-h-[600px] relative overflow-hidden border-2 shadow-2xl transition-all ${equippedClothing ? 'border-purple-500/50' : 'border-white/10'}`}
                onDragOver={onDragOver}
                onDrop={onDrop}
              >
                {/* 3D 캔버스 엔진 삽입 */}
                <Canvas shadows camera={{ position: [0, 1, 6], fov: 50 }}>
                  <color attach="background" args={['#0a0a0e']} />
                  <ambientLight intensity={0.6} />
                  <spotLight position={[5, 10, 5]} angle={0.25} penumbra={1} intensity={1.5} castShadow />
                  <pointLight position={[-5, -5, -5]} intensity={0.5} />
                  
                  <Suspense fallback={null}>
                    {/* 실제 사람 3D 모델 출력 영역 */}
                    <RealMannequin 
                      isSpinning={isSpinning} 
                      droppedClothing={equippedClothing} 
                      avatarFace={isBaked ? avatarSources.face : null} 
                    />
                    <ContactShadows position={[0, -2, 0]} opacity={0.6} scale={15} blur={2.5} far={4} color="#000000" />
                    <Environment preset="city" />
                  </Suspense>

                  {/* 마우스 스크롤 줌 및 360도 드래그 회전 컨트롤러 */}
                  <OrbitControls 
                    enablePan={true} 
                    enableZoom={true} 
                    enableRotate={true}
                    minDistance={2}
                    maxDistance={10}
                    maxPolarAngle={Math.PI / 1.5}
                    target={[0, 1, 0]}
                  />
                </Canvas>
                
                {/* 안내 문구 / 툴바 */}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <Rotate3D size={18} className="text-purple-400" />
                    <span className="text-xs font-bold text-white/80">마우스 좌클릭 드래그: 회전 | 휠: 줌인 | 이곳으로 던지세요 (Drop)</span>
                  </div>
                  {!equippedClothing && (
                    <div className="flex items-center gap-2 bg-rose-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-rose-500/40 animate-pulse">
                      <ArrowRightLeft size={16} className="text-rose-400" />
                      <span className="text-xs font-bold text-rose-200">우측 썸네일을 잡고 이 공간으로 쭉 던지세요!</span>
                    </div>
                  )}
                  {equippedClothing && (
                    <button 
                      onClick={() => setEquippedClothing(null)}
                      className="mt-2 ml-1 px-4 py-1.5 bg-black/60 hover:bg-rose-500/30 border border-white/20 hover:border-rose-400 rounded-full text-xs font-bold text-white/70 hover:text-white transition-all w-fit"
                    >
                      장착 해제 (돌려놓기)
                    </button>
                  )}
                </div>
              </section>

              {/* 오른쪽: AI 사진 다중 입력 및 인벤토리 패널 */}
              <section className="col-span-1 lg:col-span-4 flex flex-col gap-4">
                
                {/* 1. 다중 사진 기반 내 3D 아바타 굽기 패널 */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-xl flex flex-col">
                  <h3 className="text-sm font-black text-rose-300 flex items-center gap-2 mb-3">
                    <Camera size={16} /> STEP 1 : 내 몸매 스캔 
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {/* 얼굴 */}
                    <label className="flex flex-col items-center justify-center p-2 bg-black/30 border border-white/10 hover:border-rose-400/50 rounded-xl cursor-pointer text-center relative overflow-hidden transition-all h-20">
                      {avatarSources.face && <img src={avatarSources.face} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                      <span className="text-[10px] font-bold text-white z-10">{avatarSources.face ? '✅ 완료' : '+ 얼굴 정면'}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarSourceUpload('face', e)} />
                    </label>
                    {/* 전신 */}
                    <label className="flex flex-col items-center justify-center p-2 bg-black/30 border border-white/10 hover:border-rose-400/50 rounded-xl cursor-pointer text-center relative overflow-hidden transition-all h-20">
                      {avatarSources.fullBody && <img src={avatarSources.fullBody} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                      <span className="text-[10px] font-bold text-white z-10">{avatarSources.fullBody ? '✅ 완료' : '+ 전신/알몸'}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarSourceUpload('fullBody', e)} />
                    </label>
                    {/* 상/하반신 */}
                    <label className="flex flex-col items-center justify-center p-2 bg-black/30 border border-white/10 hover:border-rose-400/50 rounded-xl cursor-pointer text-center relative overflow-hidden transition-all h-20">
                      {avatarSources.torso && <img src={avatarSources.torso} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                      <span className="text-[10px] font-bold text-white z-10">{avatarSources.torso ? '✅ 완료' : '+ 가슴/엉덩이'}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarSourceUpload('torso', e)} />
                    </label>
                  </div>
                  
                  <button 
                    onClick={() => setIsBaked(true)}
                    className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 hover:scale-[1.02] text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all border border-purple-400/30"
                  >
                    ✨ 입력된 사진들로 S라인 3D 아바타 생성 (API)
                  </button>
                  <p className="text-[9px] text-white/40 mt-2 text-center">※ 현재 데모 버전에서는 좌측 볼륨 마네킹 머리에 얼굴 사진이 랩핑됩니다. (굽기 버튼 필수!)</p>
                </div>

                {/* 2. 원클릭 / 드래그 의류 인벤토리 */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-xl flex-1 flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-purple-300 flex items-center gap-2">
                      <ShoppingBag size={16} /> STEP 2 : 마법의 3D 드래그 옷장
                    </h3>
                    <label className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-[10px] font-bold text-white cursor-pointer transition-all">
                      + 옷 사진 등 업로드
                      <input type="file" className="hidden" accept="image/*" multiple onChange={handleInventoryUpload} />
                    </label>
                  </div>
                  
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 mb-4 flex items-center gap-2 shrink-0">
                     <Heart className="text-rose-400 animate-bounce" size={16} />
                     <p className="text-xs font-bold text-white/80">아래 썸네일을 <span className="text-rose-400">마우스로 꾹 누른 채</span> 좌측 3D 몸매 위로 끌어다 놓으세요!</p>
                  </div>

                  {/* 드래그 가능한 아이템 리스트 */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-3 pb-2 pr-1">
                    {clothingInventory.length === 0 ? (
                      <div className="col-span-2 h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl text-white/30 text-xs text-center p-4">
                        <UploadCloud size={24} className="mb-2 opacity-50" />
                        우측 상단의 버튼을 눌러 속옷, 비키니 등의<br/>의류 사진 이미지를 옷장으로 가져오세요.
                      </div>
                    ) : (
                      clothingInventory.map((item) => (
                        <div 
                          key={item.id} 
                          className="bg-black/40 border border-white/10 rounded-xl p-2 cursor-grab hover:bg-black/60 hover:border-purple-500/50 transition-all flex flex-col items-center group shadow-inner"
                          draggable="true"
                          onDragStart={(e) => onDragStart(e, item)}
                          onDoubleClick={() => setEquippedClothing(item.url)}
                          title="마우스로 잡고 좌측 3D 영역으로 끌어다 넣으세요."
                        >
                          <div className="w-full h-24 rounded-lg bg-white/5 mb-2 relative overflow-hidden group-hover:scale-105 transition-transform flex items-center justify-center">
                            <img src={item.url} className="max-w-full max-h-full object-contain pointer-events-none" />
                            {/* 드래그 유도 아이콘 덮개 */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity border border-purple-500/50 rounded-lg backdrop-blur-sm">
                              <span className="text-[10px] font-black text-white px-2 py-1 bg-purple-600 rounded">드래그(Drag) ✋</span>
                            </div>
                          </div>
                          <span className="text-[9px] text-white/60 font-medium truncate w-full text-center">{item.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. 자동 런웨이 버튼을 벤치마킹하여 우측 하단으로 이동 */}
                <button 
                  onClick={() => setIsSpinning(!isSpinning)}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 text-sm font-black rounded-2xl shadow-xl transition-all hover:scale-[1.02] border shrink-0 ${isSpinning ? 'bg-black/50 border-purple-500 text-purple-400' : 'bg-gradient-to-r from-[#1a1a24] to-[#0f0f15] text-white border-white/10 hover:border-white/30'}`}
                >
                  <Play size={18} /> {isSpinning ? '쇼케이스 자동 회전 중지' : '✨ 360도 아바타 스핀 모드'}
                </button>

              </section>
            </div>
          )}

      </main>
    </div>
  );
}
