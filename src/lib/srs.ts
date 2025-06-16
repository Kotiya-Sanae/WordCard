import type { StudyRecord, WordStatus } from './db';

// 代表用户对单词的掌握程度
export type Rating = 'again' | 'hard' | 'good' | 'easy';

// FSRS算法的默认参数 (简化版)
const DECAY = -0.5;
const FACTOR = 19 / Math.abs(DECAY);
const STABILITY_GROWTH_FACTOR = 0.2;

/**
 * 计算下一次复习的间隔
 * @param stability 记忆稳定性
 * @param difficulty 单词难度
 * @param rating 用户评分
 * @returns 新的稳定性和下次复习间隔（天）
 */
function calculateNextInterval(stability: number, difficulty: number, rating: Rating) {
  let nextStability: number;
  
  switch (rating) {
    case 'again':
      nextStability = Math.max(1, stability * 0.8);
      break;
    case 'hard':
      nextStability = stability * 1.2;
      break;
    case 'good':
      nextStability = stability + (difficulty > 5 ? 1 : 2);
      break;
    case 'easy':
      nextStability = stability * 2.5;
      break;
    default:
      nextStability = stability;
  }
  
  // 简化版的间隔计算
  const interval = Math.round(nextStability * Math.log(0.9) / DECAY);
  return { nextStability, interval };
}


/**
 * 更新学习记录
 * @param record 当前的学习记录
 * @param rating用户的评分
 * @returns 更新后的学习记录对象
 */
export function srs(record: StudyRecord, rating: Rating): StudyRecord {
  const now = new Date();
  let { stability, difficulty, dueDate, status, reviewCount } = record;

  if (status === 'new') {
    stability = rating === 'again' ? 1 : (rating === 'hard' ? 2.5 : (rating === 'good' ? 5 : 10));
    difficulty = rating === 'again' ? 7 : (rating === 'hard' ? 5 : (rating === 'good' ? 3 : 1));
  }

  const { nextStability, interval } = calculateNextInterval(stability, difficulty, rating);
  
  const nextDueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
  
  let nextStatus: WordStatus = 'learning';
  if (stability > 30) { // 假设stability大于30天为已掌握
    nextStatus = 'mastered';
  }

  return {
    ...record,
    stability: nextStability,
    difficulty: difficulty,
    dueDate: nextDueDate,
    status: nextStatus,
    reviewCount: reviewCount + 1,
    lastReviewAt: now,
    lastModifiedAt: now,
  };
}