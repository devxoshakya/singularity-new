'use client';
import {
	Popover,
	PopoverBody,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
	PopoverFooter,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { User, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserProfileProps {
  src?: string;
  name?: string;
  email?: string;

}

export default function UserProfile({ src, name, email }: UserProfileProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="ghost" className="h-10 w-10 rounded-full p-0">
					<Avatar className="h-8 w-8">
						<AvatarImage src={src ?? "https://avatar.vercel.sh/128"} />
						<AvatarFallback>JD</AvatarFallback>
					</Avatar>
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-62'>
				<PopoverHeader>
					<div className="flex items-center space-x-3">
						<Avatar className="h-10 w-10">
							<AvatarImage src={src ?? "https://avatar.vercel.sh/128"} />
							<AvatarFallback>{name ? name.charAt(0) + name.charAt(1) : "JD"}</AvatarFallback>
						</Avatar>
						<div>
							<PopoverTitle>{name ?? "John Doe"}</PopoverTitle>
							<PopoverDescription className='text-xs'>{email ?? "john.doe@example.com"}</PopoverDescription>
						</div>
					</div>
				</PopoverHeader>
				<PopoverBody className="space-y-1 px-2 py-1">
					<Button variant="ghost" className="w-full justify-start" size="sm">
						<User className="mr-2 h-4 w-4" />
						View Profile
					</Button>
					<Button variant="ghost" className="w-full justify-start" size="sm">
						<Settings className="mr-2 h-4 w-4" />
						Settings
					</Button>
				</PopoverBody>
				<PopoverFooter>
					<Button variant="outline" className="w-full bg-transparent" size="sm">
						Sign Out
					</Button>
				</PopoverFooter>
			</PopoverContent>
		</Popover>
	);
}
