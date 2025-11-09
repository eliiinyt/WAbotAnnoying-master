let { performance } = require('perf_hooks')
let osu = require('node-os-utils')

module.exports = {
    name: 'status',
    description: 'pong',
    execute: async ({message}) => {
        try {
            const NotDetect = 'No detectado'
            const { cpu, drive, mem, os } = osu
            
            const [cpuInfo, driveInfo, memInfo] = await Promise.allSettled([
                cpu.usage(),
                drive.info(),
                mem.info()
            ])

            const cpuPer = cpuInfo.status === 'fulfilled' ? cpuInfo.value : NotDetect
            const { totalGb, usedGb, usedPercentage } = driveInfo.status === 'fulfilled' ? driveInfo.value : {}
            const { totalMemMb, usedMemMb } = memInfo.status === 'fulfilled' ? memInfo.value : {}

            const ramPercentage = totalMemMb && usedMemMb ? 
                Math.round(100 * (usedMemMb / totalMemMb)) + '%' : 
                NotDetect

            message.reply(`
*Status*
> CPU: ${cpu.model()}
> CPU Core: ${cpu.count()} núcleos
> Uso de CPU: ${cpuPer}%
> RAM: ${usedMemMb || NotDetect} / ${totalMemMb ? totalMemMb + ' MB' : NotDetect} (${ramPercentage})
> Sistema: ${os.platform()}
`)
        } catch (error) {
            throw new Error('Error al obtener el estado del sistema')
        }
    }
}