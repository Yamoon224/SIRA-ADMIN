import Image from "next/image"

interface AppLogoProps {
    width?: number | string
    height?: number | string
}

// Dimensions intrinsèques réelles de public/images/logo.png (1607x458), pour
// que next/image connaisse le ratio et évite tout saut de mise en page (CLS)
// pendant le chargement, même affiché à une largeur réduite via `style`.
export function AppLogo({ width = 80, height = "auto" }: AppLogoProps) {
    return (
        <Image
            src="/images/logo.png"
            alt="LOGO"
            width={1607}
            height={458}
            priority
            style={{ width, height }}
            className="object-contain"
        />
    )
}