export interface Shot {
  id: string;
  name: string;
  duration: number; // in seconds
  thumbnail: string;
  type: string; // 景别
  startTime: number; // relative to scene start
  
  // Fields from SQL schema & provided images
  projectId?: string;
  taskId?: string;
  projectFileName?: string;
  projectVersion?: string;
  baseArea?: number;
  useMultiCamera?: boolean;
  take?: number; // 场次
  guid?: string;
  sequencePath?: string;
  worldPath?: string;
  placement?: string; // 机位
  slate?: string; // 场
  date?: string;
  takeSign?: string; // 标记
  shotSize?: string; // 景别 (redundant with type but keeping for schema alignment)
  projectName?: string;
  director?: string;
  photographer?: string;
  stageLocation?: string;
  qtmDataName?: string;
  lenData?: string; // 镜头
  filmbackData?: string; // 相机
  sportMode?: string; // 运动模式
  focusDistance?: number;
  focalLength?: number;
  aperture?: number;
  temperature?: number;
  iso?: number;
  status?: string; // 渲染状态
  shootingType?: string;
  fileName?: string;
  shotFileName?: string;
  scriptContents?: string;
  rendersType?: number;
  shotType?: string;
  useEpisodes?: boolean;
  episodes?: number;
  session?: number;
  dispatch?: number;
  dataTake?: number;
  isReshoot?: boolean;
  fps?: number;
  notes?: string;
  comments?: string;

  // New fields from latest request images
  dataName?: string;
  shortName?: string;
  shootingTime?: string;
  renderTime?: string;
  obsRecording?: string;
  renderedVideo?: string;
  mainLevel?: string;
  levelSnapshot?: string;
  renderCount?: number;
  renderLevel?: string;
  visualDescription?: string;
  cameraMovement?: string;
  focalRange?: string;
  shootingMode?: string;
  renderTemplate?: string;
  qtmProjectName?: string;
  qtmVersionNumber?: string;
  apertureData?: string; // 光孔
  colorTemp?: number; // 色温
}

export interface SceneAsset {
  id: string;
  name: string;
  type: '场景' | '角色' | '道具' | '特效' | '元素';
  status: '待制作' | '制作中' | '已完成';
  progress: number;
  owner?: string;
  dueDate?: string;
  version: string;
  versionStatus: '审核中' | '已通过' | '已驳回' | '待提交';
}

export interface CallSheet {
  id: string;
  date: string;
  location: string;
  crew: string[];
  notes: string;
  status: 'draft' | 'published' | 'cancelled';
}

export type ShootingStatus = 'not-started' | 'scheduled' | 'shooting' | 'completed' | 'ng';
export type AssetRisk = 'low' | 'medium' | 'high';
export type BudgetStatus = 'on-budget' | 'warning' | 'over-budget';
export type TimelineViewMode = 'production' | 'previs' | 'asset' | string;

export interface Condition {
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains';
  value: any;
}

export interface ColorEvent {
  id: string;
  label: string;
  color: string;
  conditions: Condition[];
}

export interface CustomView {
  id: string;
  name: string;
  events: ColorEvent[];
}

export interface Scene {
  id: string;
  sceneNumber: string;
  title: string;
  description: string;
  content: string;
  duration: number;
  shots: Shot[];
  assetStatus: 'pending' | 'ready';
  productionStatus: 'not-started' | 'in-progress' | 'completed'; // Legacy
  shootingStatus: ShootingStatus;
  assetRisk: AssetRisk;
  isAssetDependent: boolean;
  plannedDate: string;
  actualDate?: string;
  owner: string;
  assetProgress: number; // 0-100
  assets: SceneAsset[];
  dependencies: string[]; // ids of other scenes
  budgetStatus: BudgetStatus;
  locationId: string;
  callSheet?: CallSheet;
  qcStatus?: 'pending' | 'completed';
  conceptStatus?: 'not-started' | 'completed';
}

export interface TimelineVersion {
  id: string;
  name: string;
  scenes: Scene[];
}

export interface Episode {
  id: string;
  number: number;
  versions: TimelineVersion[];
}

const generateShots = (episodeName: string, sceneName: string, sceneId: string, count: number): Shot[] => {
  const shots: Shot[] = [];
  const types = ['全景', '中景', '特写', '大特写'];
  let currentTime = 0;
  for (let i = 1; i <= count; i++) {
    const duration = Math.floor(Math.random() * 10) + 2;
    const shotSequence = i.toString().padStart(3, '0');
    const prefix = i % 2 === 0 ? 'm' : 'c';
    const shotName = `${prefix}-e${episodeName.slice(2)}-s${sceneName.slice(2)}_${shotSequence}`;
    shots.push({
      id: `${sceneId}-shot-${i}`,
      name: shotName,
      duration,
      type: types[Math.floor(Math.random() * types.length)],
      startTime: currentTime,
      thumbnail: `https://picsum.photos/seed/${sceneId}-${i}/200/120`,
      projectId: 'proj-001',
      director: '张导',
      photographer: '李摄',
      date: '2026-04-07',
      fps: 24,
      status: i % 3 === 0 ? '已完成' : i % 3 === 1 ? '进行中' : '待审核',
      take: Math.floor(Math.random() * 5) + 1,
      shotSize: types[Math.floor(Math.random() * types.length)],
      shootingTime: `10:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:15`,
      renderTime: `${Math.floor(Math.random() * 5)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      focalLength: [24, 35, 50, 85, 135][Math.floor(Math.random() * 5)],
      focalRange: i % 2 === 0 ? 'Prime' : 'Zoom',
      aperture: Number((1.4 + Math.random() * 4).toFixed(1)),
      colorTemp: [3200, 4300, 5600, 6500][Math.floor(Math.random() * 4)],
      iso: [400, 800, 1600, 3200][Math.floor(Math.random() * 4)],
      shootingMode: 'Manual',
      comments: i % 5 === 0 ? '光线偏暗，需要补光' : i % 5 === 1 ? '演员走位不错' : '-',
      notes: i % 7 === 0 ? '使用了手持防抖' : '-',
      shortName: shotName.split('_').pop(),
    });
    currentTime += duration;
  }
  return shots;
};

export const MOCK_EPISODES: Episode[] = [
  {
    id: 'ep-1',
    number: 1,
    versions: [
      {
        id: 'v1-1',
        name: '导演剪辑版 v1',
        scenes: [
          {
            id: 'scene-1',
            sceneNumber: 's001',
            title: 's001',
            description: '主角在一个神秘的房间里醒来。',
            content: '室内，清晨。阳光斜射入内。陈旧的木地板上落满灰尘。林墨猛地睁开眼，大口喘息着。他环顾四周，发现自己身处一个完全陌生的环境。',
            duration: 180,
            assetStatus: 'ready',
            productionStatus: 'completed',
            shootingStatus: 'completed',
            assetRisk: 'low',
            isAssetDependent: true,
            plannedDate: '2026-05-01',
            actualDate: '2026-05-01',
            owner: '张三',
            assetProgress: 100,
            budgetStatus: 'on-budget',
            dependencies: [],
            locationId: 'loc-room-1',
            qcStatus: 'completed',
            conceptStatus: 'completed',
            assets: [
              { id: 'a1', name: '神秘房间场景', type: '场景', status: '已完成', progress: 100, owner: '王五', dueDate: '2026-04-25', version: 'v004', versionStatus: '已通过' },
              { id: 'a2', name: '主角林墨模型', type: '角色', status: '已完成', progress: 100, owner: '赵六', dueDate: '2026-04-20', version: 'v012', versionStatus: '已通过' },
              { id: 'a3', name: '陈旧木地板贴图', type: '道具', status: '已完成', progress: 100, owner: '孙七', dueDate: '2026-04-22', version: 'v002', versionStatus: '已通过' },
              { id: 'a3-1', name: '清晨阳光特效', type: '特效', status: '已完成', progress: 100, owner: '周八', dueDate: '2026-04-28', version: 'v001', versionStatus: '审核中' }
            ],
            callSheet: {
              id: 'cs-1',
              date: '2026-05-01',
              location: '影棚 A-101',
              crew: ['张导', '李摄', '林墨(演员)'],
              notes: '注意地板灰尘的质感，阳光角度需精准。',
              status: 'published'
            },
            shots: generateShots('e001', 's001', 'scene-1', 10)
          },
          {
            id: 'scene-2',
            sceneNumber: 's002',
            title: 's002',
            description: '穿过漫长而阴暗的走廊，寻找出口。',
            content: '走廊，日。林墨推开沉重的木门，走廊深邃得看不见尽头。墙壁上的油漆剥落，露出斑驳的底色。他放轻脚步，但回声依然在空旷的空间里回荡。',
            duration: 240,
            assetStatus: 'ready',
            productionStatus: 'in-progress',
            shootingStatus: 'shooting',
            assetRisk: 'medium',
            isAssetDependent: true,
            plannedDate: '2026-05-05',
            owner: '李四',
            assetProgress: 85,
            budgetStatus: 'warning',
            dependencies: ['scene-1'],
            locationId: 'loc-hallway-1',
            qcStatus: 'pending',
            conceptStatus: 'completed',
            assets: [
              { id: 'a4', name: '阴暗走廊场景', type: '场景', status: '制作中', progress: 80, owner: '王五', dueDate: '2026-05-03', version: 'v003', versionStatus: '审核中' },
              { id: 'a5', name: '剥落墙皮特效', type: '特效', status: '已完成', progress: 100, owner: '周八', dueDate: '2026-05-01', version: 'v002', versionStatus: '已通过' },
              { id: 'a6', name: '沉重木门道具', type: '道具', status: '已完成', progress: 100, owner: '孙七', dueDate: '2026-04-30', version: 'v001', versionStatus: '已通过' },
              { id: 'a6-1', name: '走廊回声元素', type: '元素', status: '已完成', progress: 100, owner: '吴九', dueDate: '2026-05-02', version: 'v001', versionStatus: '已通过' }
            ],
            shots: generateShots('e001', 's002', 'scene-2', 10)
          },
          {
            id: 'scene-3',
            sceneNumber: 's003',
            title: 's003',
            description: '在走廊尽头遇到神秘的陌生人。',
            content: '走廊尽头，日。林墨停下脚步。前方站着一个黑影，背对着他。黑影似乎在等待着什么。',
            duration: 150,
            assetStatus: 'pending',
            productionStatus: 'not-started',
            shootingStatus: 'scheduled',
            assetRisk: 'high',
            isAssetDependent: true,
            plannedDate: '2026-05-10',
            owner: '王五',
            assetProgress: 45,
            budgetStatus: 'over-budget',
            dependencies: ['scene-2'],
            locationId: 'loc-hallway-1',
            qcStatus: 'pending',
            conceptStatus: 'not-started',
            assets: [
              { id: 'a7', name: '陌生人角色模型', type: '角色', status: '制作中', progress: 30, owner: '赵六', dueDate: '2026-05-08', version: 'v001', versionStatus: '待提交' },
              { id: 'a8', name: '黑影特效', type: '特效', status: '待制作', progress: 0, owner: '周八', dueDate: '2026-05-09', version: 'v000', versionStatus: '待提交' },
              { id: 'a9', name: '走廊尽头资产', type: '场景', status: '制作中', progress: 60, owner: '王五', dueDate: '2026-05-07', version: 'v002', versionStatus: '已驳回' }
            ],
            shots: generateShots('e001', 's003', 'scene-3', 10)
          },
          {
            id: 'scene-4',
            sceneNumber: 's004',
            title: 's004',
            description: '在密室中寻找线索，解开谜题。',
            content: '密室，夜。墙上挂满了奇怪的符号。林墨在书架上翻找，试图找到开启暗门的机关。',
            duration: 300,
            assetStatus: 'ready',
            productionStatus: 'in-progress',
            shootingStatus: 'not-started',
            assetRisk: 'low',
            isAssetDependent: true,
            plannedDate: '2026-05-15',
            owner: '赵六',
            assetProgress: 90,
            budgetStatus: 'on-budget',
            dependencies: ['scene-3'],
            locationId: 'loc-room-2',
            assets: [
              { id: 'a10', name: '密室场景', type: '场景', status: '已完成', progress: 100, owner: '王五', dueDate: '2026-05-12', version: 'v005', versionStatus: '已通过' },
              { id: 'a11', name: '奇怪符号贴图', type: '贴图' as any, status: '已完成', progress: 100, owner: '孙七', dueDate: '2026-05-13', version: 'v001', versionStatus: '已通过' }
            ],
            shots: generateShots('e001', 's004', 'scene-4', 10)
          },
          {
            id: 'scene-5',
            sceneNumber: 's005',
            title: 's005',
            description: '在茂密的森林中躲避追捕。',
            content: '森林，日。树木繁茂，阳光难以穿透。林墨在林间穿梭，身后传来急促的脚步声。',
            duration: 420,
            assetStatus: 'pending',
            productionStatus: 'not-started',
            shootingStatus: 'not-started',
            assetRisk: 'medium',
            isAssetDependent: true,
            plannedDate: '2026-05-20',
            owner: '孙七',
            assetProgress: 20,
            budgetStatus: 'on-budget',
            dependencies: ['scene-4'],
            locationId: 'loc-forest-1',
            assets: [
              { id: 'a12', name: '森林场景', type: '场景', status: '制作中', progress: 20, owner: '王五', dueDate: '2026-05-18', version: 'v001', versionStatus: '待提交' }
            ],
            shots: generateShots('e001', 's005', 'scene-5', 10)
          },
          {
            id: 'scene-6',
            sceneNumber: 's006',
            title: 's006',
            description: '在悬崖边缘面临生死抉择。',
            content: '悬崖，黄昏。风声呼啸。林墨站在悬崖边缘，前方是万丈深渊，后方是逼近的追兵。',
            duration: 180,
            assetStatus: 'ready',
            productionStatus: 'not-started',
            shootingStatus: 'ng',
            assetRisk: 'low',
            isAssetDependent: false,
            plannedDate: '2026-05-25',
            owner: '周八',
            assetProgress: 100,
            budgetStatus: 'on-budget',
            dependencies: ['scene-5'],
            locationId: 'loc-cliff-1',
            assets: [
              { id: 'a13', name: '悬崖场景', type: '场景', status: '已完成', progress: 100, owner: '王五', dueDate: '2026-05-22', version: 'v003', versionStatus: '已通过' }
            ],
            shots: generateShots('e001', 's006', 'scene-6', 10)
          }
        ]
      },
      {
        id: 'v1-2',
        name: '最终定稿版',
        scenes: []
      }
    ]
  },
  {
    id: 'ep-2',
    number: 2,
    versions: [
      {
        id: 'v2-1',
        name: '工作草案',
        scenes: []
      }
    ]
  }
];
