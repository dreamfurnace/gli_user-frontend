import { ref } from 'vue'
import { Connection, PublicKey, Transaction, SystemProgram, clusterApiUrl } from '@solana/web3.js'
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useSolanaWallet } from './useSolanaWallet'
import { useGLILToken } from './useGLILToken'

// Solana 연결
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')

// GLI-L 토큰 결제를 위한 상수 (실제 환경에서는 환경변수로 관리)
const GLIL_TOKEN_MINT = new PublicKey('GLiLTokenMintAddressHere') // 실제 GLI-L 토큰 민트 주소로 교체
const GLI_TREASURY_WALLET = new PublicKey('TreasuryWalletAddressHere') // 실제 GLI 재무 지갑 주소로 교체

export function useSolanaPayment() {
  const { wallet, publicKey, signTransaction } = useSolanaWallet()
  const { GLIL_DECIMALS } = useGLILToken()
  
  const isProcessing = ref(false)
  const error = ref<string>('')

  // GLI-L 토큰 전송 트랜잭션 생성
  const createGLILTransferTransaction = async (
    fromWallet: PublicKey,
    toWallet: PublicKey,
    amount: number
  ): Promise<Transaction> => {
    try {
      // 토큰 계정 주소 가져오기
      const fromTokenAccount = await getAssociatedTokenAddress(
        GLIL_TOKEN_MINT,
        fromWallet
      )
      
      const toTokenAccount = await getAssociatedTokenAddress(
        GLIL_TOKEN_MINT,
        toWallet
      )

      // 최신 블록해시 가져오기
      const { blockhash } = await connection.getLatestBlockhash()

      // 트랜잭션 생성
      const transaction = new Transaction()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = fromWallet

      // GLI-L 토큰 amount를 소수점 단위로 변환
      const tokenAmount = Math.floor(amount * Math.pow(10, GLIL_DECIMALS))

      // 전송 인스트럭션 추가
      const transferInstruction = createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromWallet,
        tokenAmount,
        [],
        TOKEN_PROGRAM_ID
      )

      transaction.add(transferInstruction)

      return transaction

    } catch (err: any) {
      console.error('Failed to create GLI-L transfer transaction:', err)
      throw new Error(`트랜잭션 생성 실패: ${err.message}`)
    }
  }

  // GLI-L 토큰 결제 처리
  const processGLILPayment = async (
    orderId: string,
    amount: number
  ): Promise<string> => {
    if (!publicKey.value) {
      throw new Error('지갑이 연결되지 않았습니다.')
    }

    if (!signTransaction.value) {
      throw new Error('지갑에서 트랜잭션 서명을 지원하지 않습니다.')
    }

    isProcessing.value = true
    error.value = ''

    try {
      console.log(`Processing GLI-L payment for order ${orderId}, amount: ${amount}`)

      // 1. 트랜잭션 생성
      const transaction = await createGLILTransferTransaction(
        publicKey.value,
        GLI_TREASURY_WALLET,
        amount
      )

      // 2. 트랜잭션 서명
      const signedTransaction = await signTransaction.value(transaction)

      // 3. 트랜잭션 전송 및 확인
      const txSignature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      )

      console.log('Transaction sent:', txSignature)

      // 4. 트랜잭션 확인 대기
      const confirmation = await connection.confirmTransaction(
        txSignature,
        'confirmed'
      )

      if (confirmation.value.err) {
        throw new Error(`트랜잭션 실패: ${confirmation.value.err}`)
      }

      console.log('Transaction confirmed:', txSignature)
      return txSignature

    } catch (err: any) {
      console.error('GLI-L payment failed:', err)
      error.value = err.message || '결제 처리에 실패했습니다.'
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  // 임시 결제 처리 (실제 블록체인 없이 테스트용)
  const processTestPayment = async (
    orderId: string,
    amount: number
  ): Promise<string> => {
    if (!publicKey.value) {
      throw new Error('지갑이 연결되지 않았습니다.')
    }

    isProcessing.value = true
    error.value = ''

    try {
      console.log(`Processing test payment for order ${orderId}, amount: ${amount}`)

      // 임시 지연으로 결제 처리 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 테스트용 트랜잭션 해시 생성
      const testTxHash = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      console.log('Test transaction completed:', testTxHash)
      return testTxHash

    } catch (err: any) {
      console.error('Test payment failed:', err)
      error.value = err.message || '결제 처리에 실패했습니다.'
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  // 결제 상태 확인
  const checkPaymentStatus = async (txSignature: string): Promise<boolean> => {
    try {
      const status = await connection.getSignatureStatus(txSignature)
      return status.value?.confirmationStatus === 'confirmed' || 
             status.value?.confirmationStatus === 'finalized'
    } catch (err) {
      console.error('Failed to check payment status:', err)
      return false
    }
  }

  // 잔액 확인
  const checkGLILBalance = async (walletAddress: PublicKey): Promise<number> => {
    try {
      const tokenAccount = await getAssociatedTokenAddress(
        GLIL_TOKEN_MINT,
        walletAddress
      )
      
      const balance = await connection.getTokenAccountBalance(tokenAccount)
      return parseFloat(balance.value.amount) / Math.pow(10, GLIL_DECIMALS)
    } catch (err) {
      console.error('Failed to check GLI-L balance:', err)
      return 0
    }
  }

  return {
    // 상태
    isProcessing,
    error,
    
    // 메서드
    processGLILPayment,
    processTestPayment,
    checkPaymentStatus,
    checkGLILBalance,
    createGLILTransferTransaction,
    
    // 상수
    GLIL_TOKEN_MINT,
    GLI_TREASURY_WALLET
  }
}