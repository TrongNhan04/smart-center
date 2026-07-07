import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "src/generated/prisma/client";
import * as bcrypt from 'bcrypt'

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
	const hashPw = await bcrypt.hash('0990000001', 15)
	const admin1 = await prisma.user.upsert({
		where: { Email: "admin1@gmail.com" },
		update: {},
		create: {
			Email: 'admin1@gmail.com',
			HoTen: "Admin 1",
			DienThoai: '0990000001',
			MatKhauHash: hashPw,
			VaiTro: 'ADMIN'
		},
	});
	
	console.log('seed hoàn tất!');
}
main()
	.then(async () => {
		await prisma.$disconnect();
		await pool.end();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		await pool.end();
		process.exit(1);
	});