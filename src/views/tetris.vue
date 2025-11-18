<template>
  <div style="margin:30px auto; max-width:440px;">
    <a-card title="俄罗斯方块" :bordered="false">
      <div
        class="tetris-board"
        :style="`width:${boardWidth}px; height:${boardHeight}px; border:2px solid #198dda; margin:auto; position:relative; background:#000;`"
      >
        <div v-for="(row, y) in displayBoard" :key="y" style="display:flex;">
          <div
            v-for="(cell, x) in row"
            :key="x"
            :style="{
              width:cellSize+'px',
              height:cellSize+'px',
              background:cell?cell:'#222',
              border:'1px solid #333'
            }"
          ></div>
        </div>
      </div>
      <div style="margin-top:20px; text-align:center;">
        <a-button size="small" @click="moveLeft">左</a-button>
        <a-button size="small" @click="rotate">旋转</a-button>
        <a-button size="small" @click="moveRight">右</a-button>
        <a-button size="small" @click="moveDown">加速下落</a-button>
        <a-button type="primary" @click="restart" style="margin-left:40px;">重新开始</a-button>
      </div>
      <div style="margin-top:20px; text-align:center;">
        <span>分数：{{score}}</span>
      </div>
    </a-card>
    <a-modal v-model:open="showGameOver" title="游戏结束" @ok="restart" :footer="null">
      <p>你的分数：{{score}}</p>
      <a-button type="primary" @click="restart">重新开始</a-button>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 棋盘参数
const rows = 24
const cols = 10
const cellSize = 22

const score = ref(0)
const board = ref(Array.from({length: rows}, () => Array(cols).fill(null)))
const showGameOver = ref(false)

// 方块形状
const shapes = [
  [[1,1,1,1]],           // I
  [[1,1],[1,1]],         // O
  [[0,1,0],[1,1,1]],     // T
  [[1,0,0],[1,1,1]],     // J
  [[0,0,1],[1,1,1]],     // L
  [[1,1,0],[0,1,1]],     // S
  [[0,1,1],[1,1,0]]      // Z
]
const colors = ['#1abc9c','#f39c12','#e74c3c','#8e44ad','#3498db','#e67e22','#2ecc71']

let timer = null

const current = ref({
  shape: [],
  color: '',
  x: 0,
  y: 0
})

function randomPiece() {
  const idx = Math.floor(Math.random() * shapes.length)
  return {
    shape: JSON.parse(JSON.stringify(shapes[idx])),
    color: colors[idx],
    x: 3,
    y: 0
  }
}

function isI(cur) {
  const s = cur.shape
  // 检查是否是I型：一行四格或一列四格
  return (s.length === 1 && s[0].length === 4) || (s.length === 4 && s[0].length === 1)
}

// SRS I型踢墙表（顺时针方向）
const iKicks = [
  [0,0], [-2,0], [1,0], [-2,1], [1,-2], 
  [0,1], [0,-1], [2,0], [-1,0], [2,-1], [-1,2]
]
// 其他型踢墙表
const defaultKicks = [
  [0,0], [1,0], [-1,0], [0,1], [0,-1], [2,0], [-2,0]
]

// 通用顺时针旋转
function rotateMatrix(mat) {
  const rows = mat.length, cols = mat[0].length
  const res = Array.from({ length: cols }, () => Array(rows).fill(0))
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      res[x][rows - y - 1] = mat[y][x]
    }
  }
  return res
}

// 判断碰撞
function isCollide(nx, ny, shape) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[0].length; x++) {
      if (shape[y][x]) {
        let px = nx + x, py = ny + y
        if (px < 0 || px >= cols || py < 0 || py >= rows || board.value[py][px]) return true
      }
    }
  }
  return false
}

function rotate() {
  let {x, y, shape} = current.value
  const newShape = rotateMatrix(shape)
  const kicks = isI(current.value) ? iKicks : defaultKicks
  for (let [dx, dy] of kicks) {
    const nx = x + dx, ny = y + dy
    if (!isCollide(nx, ny, newShape)) {
      current.value.x = nx
      current.value.y = ny
      current.value.shape = newShape
      return
    }
  }
  // 所有墙踢失败，不旋转
}

function move(dx, dy) {
  let {x, y, shape} = current.value
  if (!isCollide(x + dx, y + dy, shape)) {
    current.value.x += dx
    current.value.y += dy
  }
}

function moveLeft() { move(-1, 0) }
function moveRight() { move(1, 0) }
function moveDown() {
  let {x, y, shape} = current.value
  if (!isCollide(x, y + 1, shape)) {
    current.value.y += 1
  } else {
    fixPiece()
  }
}

function fixPiece() {
  let {x, y, shape, color} = current.value
  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[0].length; j++) {
      if (shape[i][j]) {
        board.value[y + i][x + j] = color
      }
    }
  }
  clearLines()
  spawnPiece()
}

function clearLines() {
  let lines = 0
  for (let i = rows - 1; i >= 0; i--) {
    if (board.value[i].every(cell => cell)) {
      board.value.splice(i, 1)
      board.value.unshift(Array(cols).fill(null))
      lines++
      i++
    }
  }
  score.value += lines * 100
}

function spawnPiece() {
  current.value = randomPiece()
  if (isCollide(current.value.x, current.value.y, current.value.shape)) {
    showGameOver.value = true
    stopGame()
  }
}

function restart() {
  for (let i = 0; i < rows; i++) board.value[i] = Array(cols).fill(null)
  score.value = 0
  showGameOver.value = false
  spawnPiece()
  startGame()
}

function tick() {
  if (showGameOver.value) return
  moveDown()
}

function startGame() {
  stopGame()
  timer = setInterval(tick, 400)
}
function stopGame() {
  if (timer) clearInterval(timer)
}

function handleKey(e) {
  if (showGameOver.value) return
  if (e.code === 'ArrowLeft') moveLeft()
  if (e.code === 'ArrowRight') moveRight()
  if (e.code === 'ArrowUp') rotate()
  if (e.code === 'ArrowDown') moveDown()
}

// 棋盘加上活动方块，显示用
const displayBoard = computed(() => {
  const tmp = board.value.map(row => row.slice())
  const {x, y, shape, color} = current.value
  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[0].length; j++) {
      if (shape[i][j]) {
        let px = x + j, py = y + i
        if (py >= 0 && py < rows && px >= 0 && px < cols) {
          tmp[py][px] = color
        }
      }
    }
  }
  return tmp
})

onMounted(() => {
  restart()
  window.addEventListener('keydown', handleKey)
})
onUnmounted(() => {
  stopGame()
  window.removeEventListener('keydown', handleKey)
})
</script>


<style scoped>
.tetris-board {
  user-select: none;
}
</style>
