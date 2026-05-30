/**
 * 冲突解决器
 *
 * 提供多种冲突解决策略，用于多设备数据同步时处理冲突。
 */

/**
 * 冲突解决策略枚举
 * @readonly
 * @enum {string}
 */
export const strategies = {
  /** 最后写入胜出：比较 updatedAt 时间戳，新的胜出 */
  LAST_WRITE_WINS: 'last-write-wins',
  /** 高版本胜出：比较 version 字段，高的胜出 */
  HIGHER_VERSION: 'higher-version',
  /** 手动解决：返回冲突双方，由调用方决定 */
  MANUAL: 'manual',
};

/**
 * 解决单条数据的冲突
 *
 * @param {object} local - 本地版本
 * @param {object} remote - 远程版本
 * @param {string} [strategy=strategies.LAST_WRITE_WINS] - 解决策略
 * @returns {{ winner: object, strategy: string, resolved: boolean }}
 *   - winner: 胜出的版本（策略为 MANUAL 时为 null）
 *   - strategy: 实际使用的策略
 *   - resolved: 是否已解决（MANUAL 策略下为 false）
 */
export function resolveConflict(local, remote, strategy = strategies.LAST_WRITE_WINS) {
  if (!local || !remote) {
    return {
      winner: local ?? remote ?? null,
      strategy,
      resolved: true,
    };
  }

  switch (strategy) {
    case strategies.LAST_WRITE_WINS:
      return resolveLastWriteWins(local, remote, strategy);

    case strategies.HIGHER_VERSION:
      return resolveHigherVersion(local, remote, strategy);

    case strategies.MANUAL:
      return {
        winner: null,
        strategy,
        resolved: false,
        local,
        remote,
      };

    default:
      // 默认回退到 LAST_WRITE_WINS
      return resolveLastWriteWins(local, remote, strategies.LAST_WRITE_WINS);
  }
}

/**
 * 合并两组变更列表
 *
 * 按 deviceId 分组处理：同一设备的变更按 updatedAt 排序去重，
 * 不同设备的变更直接合并。
 *
 * @param {Array<{id: string, deviceId: string, updatedAt: string|number, version?: number}>} localChanges
 * @param {Array<{id: string, deviceId: string, updatedAt: string|number, version?: number}>} remoteChanges
 * @returns {{ merged: Array, conflicts: Array<{local: object, remote: object}> }}
 */
export function mergeChanges(localChanges, remoteChanges) {
  if (!Array.isArray(localChanges)) localChanges = [];
  if (!Array.isArray(remoteChanges)) remoteChanges = [];

  const merged = [];
  const conflicts = [];

  // 用 id 索引本地变更
  const localMap = new Map();
  for (const change of localChanges) {
    localMap.set(change.id, change);
  }

  // 处理远程变更：检查是否与本地冲突
  const processedIds = new Set();
  for (const remoteChange of remoteChanges) {
    const localChange = localMap.get(remoteChange.id);

    if (!localChange) {
      // 本地没有该 id，直接采用远程版本
      merged.push(remoteChange);
      processedIds.add(remoteChange.id);
      continue;
    }

    // 本地和远程都有该 id，检测是否冲突
    processedIds.add(remoteChange.id);

    if (areEquivalent(localChange, remoteChange)) {
      // 内容相同，取任意一个
      merged.push(localChange);
    } else {
      // 存在冲突，使用 LAST_WRITE_WINS 解决
      const result = resolveConflict(localChange, remoteChange, strategies.LAST_WRITE_WINS);
      if (result.resolved) {
        merged.push(result.winner);
      } else {
        conflicts.push({ local: localChange, remote: remoteChange });
      }
    }
  }

  // 添加仅存在于本地的变更
  for (const change of localChanges) {
    if (!processedIds.has(change.id)) {
      merged.push(change);
    }
  }

  // 按 updatedAt 排序（新的在前）
  merged.sort((a, b) => {
    const timeA = new Date(a.updatedAt).getTime() || 0;
    const timeB = new Date(b.updatedAt).getTime() || 0;
    return timeB - timeA;
  });

  return { merged, conflicts };
}

// ---------------------------------------------------------------------------
// 内部工具函数
// ---------------------------------------------------------------------------

/**
 * Last-Write-Wins 策略
 *
 * 规则：
 * 1. 比较 updatedAt 时间戳，新的胜出
 * 2. 时间戳相同比较 version，高的胜出
 * 3. 完全相同则接受远程版本
 */
function resolveLastWriteWins(local, remote, strategy) {
  const localTime = new Date(local.updatedAt).getTime() || 0;
  const remoteTime = new Date(remote.updatedAt).getTime() || 0;

  if (remoteTime > localTime) {
    return { winner: remote, strategy, resolved: true };
  }

  if (localTime > remoteTime) {
    return { winner: local, strategy, resolved: true };
  }

  // 时间戳相同，比较 version
  const localVersion = local.version ?? 0;
  const remoteVersion = remote.version ?? 0;

  if (remoteVersion > localVersion) {
    return { winner: remote, strategy, resolved: true };
  }

  // 完全相同或本地 version 更高，接受远程版本
  return { winner: remote, strategy, resolved: true };
}

/**
 * Higher-Version 策略
 */
function resolveHigherVersion(local, remote, strategy) {
  const localVersion = local.version ?? 0;
  const remoteVersion = remote.version ?? 0;

  if (remoteVersion > localVersion) {
    return { winner: remote, strategy, resolved: true };
  }

  if (localVersion > remoteVersion) {
    return { winner: local, strategy, resolved: true };
  }

  // 版本相同，回退到时间戳比较
  return resolveLastWriteWins(local, remote, strategy);
}

/**
 * 判断两条变更是否等价（所有关键字段相同）
 */
function areEquivalent(a, b) {
  if (a.id !== b.id) return false;
  if (a.type !== b.type) return false;
  if (JSON.stringify(a.data) !== JSON.stringify(b.data)) return false;
  if (new Date(a.updatedAt).getTime() !== new Date(b.updatedAt).getTime()) return false;
  return true;
}
